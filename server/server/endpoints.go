package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/gorilla/sessions"
	"github.com/zmb3/spotify"
	"golang.org/x/oauth2/clientcredentials"
)

type MyServer struct {
	r *mux.Router
}

// for info on fields see https://developers.google.com/identity/sign-in/web/backend-auth
type IDToken struct {
	IDToken        string `json:"idtoken"`
	Iss            string
	Sub            string
	Azp            string
	Aud            string
	Iat            string
	Exp            string
	Email          string
	Email_verified string
	Name           string
	Picture        string
	Given_name     string
	Family_name    string
	Locale         string
}

// database connection info
var (
	pinsDBHost = os.Getenv("PINS_DB_HOST")
	pinsDBPort = os.Getenv("PINS_DB_PORT")
	pinsDBUser = os.Getenv("PINS_DB_USER")
	pinsDBPass = os.Getenv("PINS_DB_PASS")
	pinsDBName = os.Getenv("PINS_DB_NAME")
)

// declare Spotify api client variable
var client spotify.Client

// user session file store TODO: change key, make config var
var sessionStore = sessions.NewCookieStore([]byte(os.Getenv("GORILLA_SESSION_KEY")))

// declare DB connection variable
var db *sql.DB

// getSpotifyMetadata searches Spotify for complete track metadata given a pointer to a Pin with valid SpotifyID
func getSpotifyMetadata(p *Pin) error {

	// Check to see if SpotifyID exists. If not, can't get metadata so don't add
	if p.SpotifyID == "" {
		return nil
	}

	// get FullTrack from ID
	fullTrack, err := client.GetTrack(spotify.ID(p.SpotifyID))
	if err != nil {
		log.Println("getSpotifyMetadata: Error searching track with SpotifyID: %v\n%v", p.SpotifyID, err)
		log.Printf("err.Error(): %v", err.Error())
		// Check if it's a token expired error. if so get new token and retry
		if strings.Contains(err.Error(), "oauth2: token expired and refresh token is not set") {
			client = getSpotifyClient()
			return getSpotifyMetadata(p)
		}
		return err
	}
	log.Println("fullTrack = %v", fullTrack)

	// save album name from simpleAlbum
	simpleAlbum := fullTrack.Album
	p.Album = string(simpleAlbum.Name)

	// get FullAlbum with SimpleAlbum ID
	// (SimpleAlbum -> getAlbum with album ID -> fullAlbum)
	fullAlbum, err := client.GetAlbum(simpleAlbum.ID)
	if err != nil {
		log.Println("getSpotifyMetadata: Error searching album with SpotifyID: %v\n%v", fullTrack.Album.ID, err)
		log.Printf("err.Error(): %v", err.Error())
		// Check if it's a token expired error. if so get new token and retry
		if strings.Contains(err.Error(), "oauth2: token expired and refresh token is not set") {
			client = getSpotifyClient()
			return getSpotifyMetadata(p)
		}
		return err
	}

	// get image URLs (images are stored in biggest first order, and we want smallest two, so get last two in slice)
	p.SmallImageURL = string(simpleAlbum.Images[len(simpleAlbum.Images)-1].URL)
	p.MediumImageURL = string(simpleAlbum.Images[len(simpleAlbum.Images)-2].URL)

	// get release date from fullAlbum
	p.ReleaseDate = string(fullAlbum.ReleaseDate)

	// genres are (unfortunately) only available from Artist page, genres field in album is always empty
	// so get artist (only gets genres for first artist listed)
	fullArtist, err := client.GetArtist(simpleAlbum.Artists[0].ID)
	if err != nil {
		log.Println("getSpotifyMetadata: Error searching artist with SpotifyID: %v\n%v", simpleAlbum.Artists[0].ID, err)
		log.Printf("err.Error(): %v", err.Error())
		// Check if it's a token expired error. if so get new token and retry
		if strings.Contains(err.Error(), "oauth2: token expired and refresh token is not set") {
			client = getSpotifyClient()
			return getSpotifyMetadata(p)
		}
		return err
	}
	p.Genres = fullArtist.Genres

	// indicate no errors
	return nil

}

// suggestTracks searches spotify for a given query and returns up to 5 resulting tracks (or nil on error)
func suggestTracks(query string) []Pin {

	// check that query isn't empty
	if query == "" {
		log.Println("Query provided to suggestTracks is empty. Returning no results.")
		return nil
	}

	// set limit for search in search options
	opt := &spotify.Options{}
	opt.Limit = new(int)
	*opt.Limit = 5

	// search for query on spotify
	results, err := client.SearchOpt(query, spotify.SearchTypeTrack, opt)
	if err != nil {
		log.Println("Error searching Spotify track info: ", err)
		log.Printf("err.Error(): %v", err.Error())

		// Check if it's a token expired error. if so get new token and retry
		if strings.Contains(err.Error(), "oauth2: token expired and refresh token is not set") {
			client = getSpotifyClient()
			return suggestTracks(query)
		}
		return nil
	}
	log.Printf("search results: %v", results)

	// get array of suggested tracks
	var suggestedTracks []spotify.FullTrack
	if results != nil && results.Tracks != nil && results.Tracks.Tracks != nil {
		suggestedTracks = results.Tracks.Tracks // array of suggested tracks
	} else {
		log.Println("Error: Spotify did not provide suggested tracks")
		return nil
	}
	log.Printf("suggestedTracks: %v", suggestedTracks)

	// for each suggestion, get relevant info (SpotifyTitle, SpotifyArtist, SpotifyID, and SmallImageURL) and add as pin to retPins
	var retPins []Pin
	for _, track := range suggestedTracks {
		// pin to be added to retPins
		var p Pin

		simpleTrack := track.SimpleTrack

		// get SpotifyTitle
		p.SpotifyTitle = string(simpleTrack.Name)

		// get SpotifyArtist
		// TODO: handle multiple artists / get artist from album not from track (avoid wait by maroon 5 showing up as A Boogie)
		p.SpotifyArtist = string(simpleTrack.Artists[0].Name)

		// get SpotifyID
		p.SpotifyID = string(simpleTrack.ID)

		// get SmallImageURL (images are stored in biggest first order, and we want smallest, so get last in slice)
		p.SmallImageURL = string(track.Album.Images[len(track.Album.Images)-1].URL)

		// add to retPins
		retPins = append(retPins, p)
	}

	return (retPins)
}

// suggestTracksHandler handles requests to suggest-tracks
func suggestTracksHandler(w http.ResponseWriter, r *http.Request) {
	log.Println(r.Method + " " + r.URL.String())

	// get the parameters of query
	params, ok := r.URL.Query()["q"]

	if !ok || len(params) < 1 {
		log.Println("404: URL Parameter 'q' is missing.")
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte("404: Page not found"))
		return
	}

	query := params[0]

	suggestions := suggestTracks(query)

	// serve request
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(suggestions)

}

// PinsHandler routes requests to handler functions based on the HTTP request method
// GET: getPins
// POST: addPins
// PUT: updatePins
func PinsHandler(w http.ResponseWriter, r *http.Request) {

	log.Println(r.Method + " " + r.URL.String())

	switch r.Method {
	case "GET":
		// check to see if the url contains pinID (for single pin) and route accordingly
		err := r.ParseForm()
		if err != nil {
			panic(err)
		}

		if r.Form["id"] != nil {
			getSinglePin(w, r, r.Form["id"][0])
			return
		}

		if r.Form["addedBy"] != nil && len(r.Form["addedBy"]) > 0 {
			log.Printf("r.Form[\"addedBy\" = %v", r.Form["addedBy"])
			getPinsByUser(w, r, r.Form["addedBy"][0])
			return
		} else {
			getAllPins(w, r)
			return
		}

	case "POST":
		_, isAuthenticated, err := checkRequestAuthentication(r)
		if err == nil && isAuthenticated {
			addPins(w, r)
		} else {
			if err != nil {
				panic(err)
			}
			log.Println("401 Request not authorized to add pin: ", r)
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte("401: User not authorized to add pin."))
			return
		}
	case "PUT":
		updatePins()
	}
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {

	switch r.Method {
	case "GET":
		checkUserLogIn(w, r)
	case "POST":
		handleUserLogIn(w, r)
	default:
		log.Println("Invalid HTTP method for login. Expected POST, got %v" + r.Method)
		w.WriteHeader(http.StatusMethodNotAllowed) // return 405
		w.Write([]byte("405 - HTTP Method Not Allowed"))
		return
	}

}

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	err := revokeUserSession(w, r)
	if err != nil {
		panic(err)
	}
}

func UsersHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		// get userID from query parameter
		err := r.ParseForm()
		if err != nil {
			panic(err)
		}

		idParam := r.Form["id"]
		log.Println("idParam = ", idParam)
		if idParam == nil || idParam[0] == "" {
			// error ID required
			log.Println("/users GET, user ID field not found or is equal to \"\"")
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("400: id query parameter required with valid user ID"))
		} else {
			userID := idParam[0]
			displayName, err := getUserDisplayName(userID)
			if err != nil {
				// userID not found. return 404
				log.Println("userID not found. Returning 404 \"\"")
				w.WriteHeader(http.StatusNotFound)
				w.Write([]byte("404: User ID not found"))
			} else {
				log.Println("displayName = ", displayName)
				// set header response content type to JSON
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(
					struct {
						UserID      string
						DisplayName string
					}{
						userID,
						displayName,
					})
			}

		}
	case "POST":
	case "PUT":
		// read body into byte array
		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			panic(err)
		}
		log.Printf("received in PUT /users: %v\n", string(body))

		// unpack json
		var data struct {
			NewName string
		}
		err = json.Unmarshal(body, &data)
		if err != nil {
			panic(err)
		}

		if data.NewName == "" {
			log.Println("in /users PUT, no newName field included")
		} else {
			userID, isAuthenticated, err := checkRequestAuthentication(r)
			if err != nil {
				panic(err)
			} else if isAuthenticated && userID != "" {
				go updateDisplayName(userID, data.NewName)
				// send back 200 with the new display name
				w.WriteHeader(http.StatusOK)
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(
					struct {
						DisplayName string
					}{
						data.NewName,
					})
			} else {
				log.Println("/users PUT, user not authenticated or userID == \"\"")
				w.WriteHeader(http.StatusForbidden)
				w.Write([]byte("403: User not authenticated."))
			}
		}
	}
}

func SearchHandler(w http.ResponseWriter, r *http.Request) {

}

func (s *MyServer) ServeHTTP(rw http.ResponseWriter, req *http.Request) {
	if origin := req.Header.Get("Origin"); origin != "" {
		rw.Header().Set("Access-Control-Allow-Origin", origin) // TODO: change to make it not open to all origins
		rw.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		rw.Header().Set("Access-Control-Allow-Headers",
			"Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
	}
	// return if only options requested
	if req.Method == "OPTIONS" {
		return
	}
	// serve request
	s.r.ServeHTTP(rw, req)
}

// request api token for spotify
func getSpotifyClient() spotify.Client {
	config := &clientcredentials.Config{
		ClientID:     os.Getenv("SPOTIFY_ID"),
		ClientSecret: os.Getenv("SPOTIFY_SECRET"),
		TokenURL:     spotify.TokenURL,
	}
	token, err := config.Token(context.Background())
	if err != nil {
		log.Fatalf("couldn't get token: %v", err)
	}

	return spotify.Authenticator{}.NewClient(token)

}

func main() {

	// seed random
	rand.Seed(time.Now().UnixNano())

	// set up DB connection
	psqlInfo := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", os.Getenv("PINS_DB_HOST"), os.Getenv("PINS_DB_PORT"), os.Getenv("PINS_DB_USER"), os.Getenv("PINS_DB_PASS"), os.Getenv("PINS_DB_NAME"))
	log.Println("psqlInfo: " + psqlInfo)
	var err error
	db, err = sql.Open("postgres", psqlInfo)
	if err != nil {
		panic(err)
	}
	defer db.Close()

	// set up spotify client for future calls
	client = getSpotifyClient()

	// load playlister state code -> playlist mappings
	loadStatePlaylistsFile()

	r := mux.NewRouter()
	r.HandleFunc("/api/pins", PinsHandler)
	r.HandleFunc("/api/login", LoginHandler)
	r.HandleFunc("/api/logout", LogoutHandler)
	r.HandleFunc("/api/search", SearchHandler)
	r.HandleFunc("/api/suggest-tracks", suggestTracksHandler)
	r.HandleFunc("/api/users", UsersHandler)

	r.HandleFunc("/api/playlisterauthentication", setupClient)
	r.HandleFunc("/api/playlistercallback", completeAuth)

	// CORS setup
	headersOk := handlers.AllowedHeaders([]string{"X-Requested-With", "Content-Type"})
	originsOk := handlers.AllowedOrigins([]string{os.Getenv("ALLOWED_ORIGINS")})
	methodsOk := handlers.AllowedMethods([]string{"GET", "HEAD", "POST", "PUT", "OPTIONS"})
	credentialsOk := handlers.AllowCredentials()

	log.Println("starting server on port 8080")
	log.Fatal(http.ListenAndServe(":8080", handlers.CORS(originsOk, headersOk, methodsOk, credentialsOk)(&MyServer{r})))

}
