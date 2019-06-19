package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"math/rand"
	"net/http"
	"time"

	"github.com/lib/pq" // import even though not referenced in code (for psql drivers)
)

type Pin struct {
	PinID          string   `json:",omitempty"`
	Lat            float32  `json:",omitempty"` // required
	Lng            float32  `json:",omitempty"` // required
	Title          string   `json:",omitempty"` // required
	Artist         string   `json:",omitempty"` // required
	Lyric          string   `json:",omitempty"` // required
	Album          string   `json:",omitempty"`
	ReleaseDate    string   `json:",omitempty"`
	Genres         []string `json:",omitempty"`
	SpotifyID      string   `json:",omitempty"`
	SpotifyTitle   string   `json:",omitempty"` // the title of the track in spotify
	SpotifyArtist  string   `json:",omitempty"` // artist of track in spotify
	SmallImageURL  string   `json:",omitempty"` // URL of album image in smallest size format
	MediumImageURL string   `json:",omitempty"` // URL of album image in medium size format
	CreatedBy      string   `json:",omitempty"`
	CreatedDate    string   `json:",omitempty"`
}

// generate a random alphanumeric ID for the pin
func generateID() string {

	// length of id to generate
	id_length := 8

	// chars that will be used to generate id from
	var chars = []rune("abcdefghijklmnopqrstuvwxyz0123456789")

	id := make([]rune, id_length)
	for i := range id {
		id[i] = chars[rand.Intn(len(chars))]
	}

	return string(id)
}

func getPins() []Pin {
	retPins := []Pin{}

	queryString := "SELECT id, lat, lng FROM pins;"
	rows, err := db.Query(queryString)

	if err != nil {
		panic(err)
	}
	defer rows.Close()
	for rows.Next() {

		// create new pin to hold row data
		var p Pin
		err = rows.Scan(&p.PinID, &p.Lat, &p.Lng)
		if err != nil {
			panic(err)
		}

		// add pin to return list
		retPins = append(retPins, p)
	}

	return retPins
}

func getPinsByUserId(addedBy string) []Pin {

	retPins := []Pin{}

	queryString := "SELECT id, lat, lng, title, artist, lyric, album, release_date, genres, spotify_id, spotify_artist, created_by, created_time FROM pins WHERE created_by=$1;"
	rows, err := db.Query(queryString, addedBy)

	if err != nil {
		panic(err)
	}
	defer rows.Close()
	for rows.Next() {

		// create new pin to hold row data
		var p Pin
		var createdTime pq.NullTime
		err = rows.Scan(&p.PinID, &p.Lat, &p.Lng, &p.Title, &p.Artist, &p.Lyric, &p.Album, &p.ReleaseDate, pq.Array(&p.Genres), &p.SpotifyID, &p.SpotifyArtist, &p.CreatedBy, &createdTime)
		if err != nil {
			panic(err)
		}

		// add pin to return list
		retPins = append(retPins, p)
	}

	return retPins

}

func getPinByID(pinID string) []Pin {

	var p Pin
	var createdTime pq.NullTime

	sqlStatement := `SELECT id, lat, lng, title, artist, lyric, album, release_date, genres, spotify_id, spotify_artist, created_by, created_time
                     FROM pins WHERE id=$1;`
	row := db.QueryRow(sqlStatement, pinID)
	switch err := row.Scan(&p.PinID, &p.Lat, &p.Lng, &p.Title, &p.Artist, &p.Lyric, &p.Album, &p.ReleaseDate, pq.Array(&p.Genres), &p.SpotifyID, &p.SpotifyArtist, &p.CreatedBy, &createdTime); err {
	case sql.ErrNoRows:
		log.Printf("No rows were returned for pinID %s", pinID)
		return (nil)
	case nil:
		// convert time format to string
		if createdTime.Valid && !(createdTime.Time.IsZero()) {
			p.CreatedDate = createdTime.Time.Format("January 2, 2006") // "January 2, 2006" is template date for time.Time.Format()
		}
		fmt.Println(p.PinID, p.Lat, p.Lng, p.Title, p.Artist, p.Lyric, p.Album, p.ReleaseDate, p.Genres, p.SpotifyID, p.SpotifyArtist, p.CreatedBy, createdTime)
	default:
		panic(err)
	}

	// add external image links to pin fields
	getSpotifyMetadata(&p)

	return ([]Pin{p})
}

func validatePin(p Pin) bool {

	// check to see if the required fields are set
	if p.Lat == 0 {
		log.Println("Incomplete pin, p.Lat not set")
		return false
	}
	if p.Lng == 0 {
		log.Println("Incomplete pin, p.Lng not set")
		return false
	}
	if p.Title == "" {
		log.Println("Incomplete pin, p.Lng not set")
		return false
	}
	if p.Artist == "" {
		log.Println("Incomplete pin, p.Artist not set")
		return false
	}
	if p.Lyric == "" {
		log.Println("Incomplete pin, p.Lyric not set")
		return false
	}

	return true
}

func storePin(p Pin) (string, error) {

	log.Println("calling storePin with pin: ", p)

	// Fill in more info from Spotify (if pin contains valid spotifyID)
	err := getSpotifyMetadata(&p)
	if err != nil {
		log.Println("Error getting spotify metadata: ", err)
	}

	// Attempt to add pin to state playlist
	go addPinToStatePlaylist(p)

	p.PinID = generateID()

	creationTime := time.Now()

	sqlStatement := `INSERT INTO pins (id, lat, lng, title, artist, lyric, album, release_date, genres, spotify_id, spotify_artist, created_by, created_time)
                        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    `
	_, err = db.Exec(sqlStatement, p.PinID, p.Lat, p.Lng, p.Title, p.Artist, p.Lyric, p.Album, p.ReleaseDate, pq.Array(p.Genres), p.SpotifyID, p.SpotifyArtist, p.CreatedBy, creationTime)
	if err != nil {
		panic(err)
	}

	return p.PinID, err
}

func addPins(w http.ResponseWriter, r *http.Request) {

	// read body into byte array
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		panic(err)
	}
	log.Printf("received: %v\n", string(body))

	// unpack json
	var p Pin
	err = json.Unmarshal(body, &p)
	if err != nil {
		panic(err)
	}

	// get user from session
	session, err := sessionStore.Get(r, "lyricmap")
	if err != nil {
		panic(err)
	}
	p.CreatedBy = session.Values["userID"].(string)

	if !validatePin(p) {
		log.Printf("pin %v invalid\n", p)
		http.Error(w, "Pin fields invalid", http.StatusBadRequest)
		return
	}

	pinID, err := storePin(p)
	if err != nil {
		log.Printf("Error saving pin to DB, returning 500")
		http.Error(w, "Error saving pin.", http.StatusInternalServerError)
		return
	} else {
		log.Printf("Success saving pin, returning pinID")
		w.WriteHeader(http.StatusCreated)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(struct {
			PinID string
			Lat   float32
			Lng   float32
		}{
			pinID,
			p.Lat,
			p.Lng,
		})
	}
}

func updatePins() {

}

func getAllPins(w http.ResponseWriter, r *http.Request) {
	var pinData []Pin

	pinData = getPins()

	log.Println("returning ", pinData)
	// set header response content type to JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pinData)
}

func getPinsByUser(w http.ResponseWriter, r *http.Request, addedBy string) {
	var pinData []Pin

	pinData = getPinsByUserId(addedBy)

	log.Println("returning ", pinData)
	// set header response content type to JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pinData)
}

func getSinglePin(w http.ResponseWriter, r *http.Request, pinID string) {
	var pinData []Pin
	pinData = getPinByID(pinID)
	log.Println("returning ", pinData)
	if pinData != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(pinData)
	} else {
		// pinID not found. return 404
		log.Println("pinID not found. Returning 404 \"\"")
		w.WriteHeader(http.StatusNotFound)
		message := fmt.Sprintf("404: Pin ID '%s' not found", pinID)
		w.Write([]byte(message))

	}
}
