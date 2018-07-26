package main

import (
    "log"
    "fmt"
    // "strings"
    "net/http"
    "encoding/json"
    "io/ioutil"
    "context"
    "os"
    "math/rand"
    "time"
    "database/sql"
    // "errors"

    "github.com/gorilla/mux"
    "github.com/zmb3/spotify"
    "golang.org/x/oauth2/clientcredentials"

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
}

type MyServer struct {
    r *mux.Router
}

// database connection info
var (
    pinsDBHost = os.Getenv("PINS_DB_HOST")
    pinsDBPort = os.Getenv("PINS_DB_PORT")
    pinsDBUser = os.Getenv("PINS_DB_USER")
    pinsDBPass = os.Getenv("PINS_DB_PASS")
    pinsDBName = os.Getenv("PINS_DB_NAME") // db name
)

// declare Spotify api client variable
var client spotify.Client

// declare DB connection variable
var db *sql.DB 

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
    // TODO return all pins from db

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

    // return all pins
    // retPins := []Pin{{PinID: "1", Lat: 37.027718, Lng: -95.625},
    //                  {PinID: "2", Lat: 35.027718, Lng: -95.625},
    //                  {PinID: "3", Lat: 38.904510, Lng: -77.050137}}

    return retPins
    
}

func getPinByID(pinID string) []Pin {

    // spotifyembed: null,
    //   title: null,
    //   artist: null,
    //   album: null,
    //   year: null,
    //   lyrics: null,
    //   genre: null,

    var p Pin

    sqlStatement := `SELECT id, lat, lng, title, artist, lyric, album, release_date, genres, spotify_id, spotify_artist
                     FROM pins WHERE id=$1;`
    row := db.QueryRow(sqlStatement, pinID)
    switch err := row.Scan(&p.PinID, &p.Lat, &p.Lng, &p.Title, &p.Artist, &p.Lyric, &p.Album, &p.ReleaseDate, pq.Array(&p.Genres), &p.SpotifyID, &p.SpotifyArtist); err {
    case sql.ErrNoRows:
      fmt.Println("No rows were returned!")
    case nil:
      fmt.Println(p.PinID, p.Lat, p.Lng, p.Title, p.Artist, p.Lyric, p.Album, p.ReleaseDate, p.Genres, p.SpotifyID, p.SpotifyArtist)
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

// getSpotifyMetadata searches Spotify for complete track metadata given a pointer to a Pin with valid SpotifyID
// TODO: unnecessary with new spotify suggestion add pin flow?
func getSpotifyMetadata (p *Pin) error {

    // Check to see if SpotifyID exists. If not, can't get metadata so don't add
    if p.SpotifyID == "" {
        return nil
    }

    // get pin info
    // album name
    // release date, (in FullAlbum)
    // genre (in FullAlbum)

    // get FullTrack from ID
    fullTrack, err := client.GetTrack(spotify.ID(p.SpotifyID))
    if err != nil {
        log.Println("getSpotifyMetadata: Error searching track with SpotifyID: %v\n%v", p.SpotifyID, err)
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
        return err
    }

    // get release date from fullAlbum
    p.ReleaseDate = string(fullAlbum.ReleaseDate)
    
    // genres are (unfortunately) only available from Artist page, genres field in album is always empty
    // so get artist (only gets genres for first artist listed)
    fullArtist, err := client.GetArtist(simpleAlbum.Artists[0].ID)
    if err != nil {
        log.Println("getSpotifyMetadata: Error searching artist with SpotifyID: %v\n%v", simpleAlbum.Artists[0].ID, err)
        return err
    }
    p.Genres = fullArtist.Genres

    // indicate no errors
    return nil

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

    sqlStatement := `INSERT INTO pins (id, lat, lng, title, artist, lyric, album, release_date, genres, spotify_id, spotify_artist)
                        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        `
    _, err = db.Exec(sqlStatement, p.PinID, p.Lat, p.Lng, p.Title, p.Artist, p.Lyric, p.Album, p.ReleaseDate, pq.Array(p.Genres), p.SpotifyID, p.SpotifyArtist)
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
    log.Printf("%v", p.Artist)

    if !validatePin(p) {
        log.Printf("pin %v invalid\n", p)
        return
    }

    go storePin(p)
    
}

func updatePins() {

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
        p.SmallImageURL = string(track.Album.Images[len(track.Album.Images) - 1].URL)

        // add to retPins
        retPins = append(retPins, p)
    }


    return(retPins)
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

    var pinData []Pin

    switch r.Method {
    case "GET":
        // check to see if the url contains pinID (for single pin) and route accordingly
        err := r.ParseForm()
        if err != nil {
            panic(err)
        }

        idParam := r.Form["id"]
        if idParam == nil {
            pinData = getPins()
        } else {
            pinData = getPinByID(idParam[0])
        }

        log.Println("returning ", pinData)
        // set header response content type to JSON
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(pinData)
    case "POST":
        addPins(r)
    case "PUT":
        updatePins()
    }

}

func LoginHandler(w http.ResponseWriter, r *http.Request) {

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

    generateID()

    client = getSpotifyClient()

    r := mux.NewRouter()
    r.HandleFunc("/pins", PinsHandler)
    r.HandleFunc("/login", LoginHandler)
    r.HandleFunc("/search", SearchHandler)
    r.HandleFunc("/suggest-tracks", suggestTracksHandler)

    log.Println("starting server on port 8080")
    log.Fatal(http.ListenAndServe(":8080", &MyServer{r}))

}