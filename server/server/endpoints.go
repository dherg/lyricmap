package main

import (
    "log"
    // "fmt"
    // "strings"
    "net/http"
    "encoding/json"
    "io/ioutil"
    "context"
    "os"
    // "errors"

    "github.com/gorilla/mux"
    "github.com/zmb3/spotify"
    "golang.org/x/oauth2/clientcredentials"
)

type Pin struct {
    PinId string `json:",omitempty"`
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

// image_url, title, artist, and spotifyID to be displayed as spotify suggestions for add track
// type TrackSuggestion struct {
    
// }

type MyServer struct {
    r *mux.Router
}

// set Spotify api client variable
var client spotify.Client

// type test_struct struct {
//     Lat string
//     Lng string
//     Title string
//     Artist string
//     Lyric string
// }

func getPins(pinId string) []Pin {
    // Right now returns all pins
    // TODO return all pins if no pinId parameter in request, else return info about that pin
    if pinId != "" { // return info for specific pin
        return nil
    } else { // return all pins
        retPins := []Pin{{PinId: "1", Lat: 37.027718, Lng: -95.625},
                         {PinId: "2", Lat: 35.027718, Lng: -95.625},
                         {PinId: "3", Lat: 38.904510, Lng: -77.050137}}

        return retPins
    } 
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
    fullAlbum, err := client.GetAlbum(spotify.ID(simpleAlbum.ID))
    if err != nil {
        log.Println("getSpotifyMetadata: Error searching album with SpotifyID: %v\n%v", fullTrack.Album.ID, err)
        return err
    }

    // get release date and genres from fullAlbum
    p.ReleaseDate = string(fullAlbum.ReleaseDate)
    p.Genres = fullAlbum.Genres

    // indicate no errors
    return nil

}

func storePin(p Pin) {
    // add pin metadata
    log.Println("calling storePin with pin: ", p)

    // get full spotify info if request comes with a spotifyID (what info do I want? at least release date, genre)
    err := getSpotifyMetadata(&p)
    if err != nil {
        log.Println("Error: Couldn't search spotify: ", err)
    }

    // add pin to db

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
    log.Println(r.Method + " " + r.URL.Path)

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

    log.Println(r.Method + " " + r.RequestURI)


    var pinData []Pin

    switch r.Method {
    case "GET":
        pinData = getPins("")
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

    client = getSpotifyClient()

    r := mux.NewRouter()
    r.HandleFunc("/pins", PinsHandler)
    r.HandleFunc("/login", LoginHandler)
    r.HandleFunc("/search", SearchHandler)
    r.HandleFunc("/suggest-tracks", suggestTracksHandler)

    log.Println("starting server on port 8080")
    log.Fatal(http.ListenAndServe(":8080", &MyServer{r}))

}