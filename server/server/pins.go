package main

import (
    "log"
    "fmt"
    "time"
    "net/http"
    "encoding/json"
    "io/ioutil"
    "math/rand"
    "database/sql"

    "github.com/lib/pq" // import even though not referenced in code (for psql drivers)
)

type Pin struct {
    PinID string `json:",omitempty"`
    Lat float32 `json:",omitempty"` // required
    Lng float32 `json:",omitempty"` // required
    Title string `json:",omitempty"` // required
    Artist string `json:",omitempty"` // required
    Lyric string `json:",omitempty"` // required
    Album string `json:",omitempty"`
    ReleaseDate string `json:",omitempty"`
    Genres []string `json:",omitempty"`
    SpotifyID string `json:",omitempty"`
    SpotifyTitle string `json:",omitempty"` // the title of the track in spotify
    SpotifyArtist string `json:",omitempty"` // artist of track in spotify
    SmallImageURL string `json:",omitempty"` // URL of album image in smallest format
    CreatedBy string `json:",omitempty"`
    CreatedDate string `json:",omitempty"`
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

    rows, err := db.Query("SELECT id, lat, lng FROM pins;")
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

func getPinByID(pinID string) []Pin {

    var p Pin
    var createdTime pq.NullTime

    sqlStatement := `SELECT id, lat, lng, title, artist, lyric, album, release_date, genres, spotify_id, spotify_artist, created_by, created_time
                     FROM pins WHERE id=$1;`
    row := db.QueryRow(sqlStatement, pinID)
    switch err := row.Scan(&p.PinID, &p.Lat, &p.Lng, &p.Title, &p.Artist, &p.Lyric, &p.Album, &p.ReleaseDate, pq.Array(&p.Genres), &p.SpotifyID, &p.SpotifyArtist, &p.CreatedBy, &createdTime); err {
    case sql.ErrNoRows:
        fmt.Println("No rows were returned!")
    case nil:
        // convert time format to string
        if createdTime.Valid && !(createdTime.Time.IsZero()) {
            p.CreatedDate = createdTime.Time.Format("January 2, 2006") // "January 2, 2006" is template date for time.Time.Format()
        }
        fmt.Println(p.PinID, p.Lat, p.Lng, p.Title, p.Artist, p.Lyric, p.Album, p.ReleaseDate, p.Genres, p.SpotifyID, p.SpotifyArtist, p.CreatedBy, createdTime)
    default:
        panic(err)
    }

    return([]Pin{p})
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

func storePin(p Pin) {
    // add pin metadata
    log.Println("calling storePin with pin: ", p)

    // try to get spotify metadata
    err := getSpotifyMetadata(&p)
    if err != nil {
        log.Println("Error getting spotify metadata: ", err)
    }

    // add pin to db
    // generate a pinID
    p.PinID = generateID()

    // get pin date added
    // year, month, day := time.Now().Date()
    // p.CreatedDate = time.Now()
    // try to get a string out of p.CreatedDate
    // dateString := p.CreatedDate.Format("January 2, 2006") // "January 2, 2006" is template for time.Time.Format()
    // log.Println(dateString)
    // fmt.Printf("insert time:\n%v\n%v\n%v", year, month, day)

    creationTime := time.Now()

    sqlStatement := `INSERT INTO pins (id, lat, lng, title, artist, lyric, album, release_date, genres, spotify_id, spotify_artist, created_by, created_time)
                        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    `
    _, err = db.Exec(sqlStatement, p.PinID, p.Lat, p.Lng, p.Title, p.Artist, p.Lyric, p.Album, p.ReleaseDate, pq.Array(p.Genres), p.SpotifyID, p.SpotifyArtist, p.CreatedBy, creationTime)
    if err != nil {
        panic(err)
    }
}

func addPins(r *http.Request) {

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
        return
    }

    go storePin(p)
}

func updatePins() {

}