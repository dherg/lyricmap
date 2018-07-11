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
    "errors"

    "github.com/gorilla/mux"
    "github.com/zmb3/spotify"
    "golang.org/x/oauth2/clientcredentials"
)

type Pin struct {
    PinId string `json:",omitempty"`
    Lat float32 `json:",omitempty"`
    Lng float32 `json:",omitempty"`
    Title string `json:",omitempty"`
    Artist string `json:",omitempty"`
    Lyric string `json:",omitempty"`
    Year string `json:",omitempty"`
    Genre string `json:",omitempty"`
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
    // TODO: validate pin submission
    return true
}

// searchSpotify searches Spotify for complete track info given a pointer to a Pin with Title and Artist fields
// TODO: unnecessary with new spotify suggestion add pin flow?
func searchSpotify (p *Pin) error {

    if p.Artist == "" || p.Title == "" {
        return errors.New("searchSpotify: provided Pin has no Title or no Artist")
    }

    // search for track info
    query := fmt.Sprintf("track:%v artist:%v", p.Title, p.Artist)
    log.Println("query: ", query)
    results, err := client.Search(query, spotify.SearchTypeTrack)
    if err != nil {
        log.Println("Error searching Spotify track info: ", err)
        return err
    }
    log.Printf("search results: %v", results)

    // parse results. want to find:
    // - SpotifyID [results.Tracks.Tracks.SimpleTrack.ID]
    // - Year [album api]
    // - Spotify Song Name [results.Tracks.Tracks.SimpleTrack.Name]
    // - Spotify Artist Name
    // - Spotify Album Name
    // - Spotify genre [album api]
    if results.Tracks != nil && results.Tracks.Tracks != nil {
        if len(results.Tracks.Tracks) > 0 {
            // fmt.Println("Tracks:")
            // for _, item := range results.Tracks.Popularity {
            //     fmt.Println("item:   ", item)
            // }
            log.Println("results: ", results) // &{<nil> <nil> <nil> 0xc4203b6d80}
            log.Println("results.Tracks: ", results.Tracks) // &{{https://api.spotify.com/v1/search?query=track%3Aab%2520artist%3Aab&type=track&offset=0&limit=20 20 0 0  } []}
            log.Println("results.Tracks.Tracks: ", results.Tracks.Tracks)
            log.Println("len(results.Tracks.Tracks): ", len(results.Tracks.Tracks))
            log.Println("results.Tracks.Tracks[0]: ", results.Tracks.Tracks[0]) // FullTrack object e.g.: TRACK<[3ncgNpxLoBQ65ABk4djDyd] [PICK IT UP (feat. A$AP Rocky)]> 
            fullTrack := results.Tracks.Tracks[0]
            simpleTrack := fullTrack.SimpleTrack

            // get SpotifyID
            p.SpotifyID = string(simpleTrack.ID)

            // get Spotify song name
            log.Println("simpleTrack.Name: ", simpleTrack.Name)
            p.Title = string(simpleTrack.Name)

            // get Spotify

            // get Year
            // album := fullTrack.Album // SimpleAlbum
            // log.Println("fullTrack.Album: ", album)
        } else {
            return errors.New("searchSpotify: no Track results found")
        }
    } else {
        log.Println("results.Tracks: ", results.Tracks)
        return errors.New("searchSpotify: results.Tracks or results.Tracks.Tracks was nil.")
    }

    // indicate no errors
    return nil
}

func storePin(p Pin) {
    // add pin metadata
    log.Println("calling storePin with pin: ", p)

    // get spotify info (what info do I want? at least year, spotify embed, album, genre)
    err := searchSpotify(&p)
    if err != nil {
        log.Println("Error: Couldn't search spotify playlists: ", err)
    }

    // example call vv
    // msg, page, err := client.FeaturedPlaylists()
    // if err != nil {
    //     log.Fatalf("couldn't get features playlists: %v", err)
    // }
    // fmt.Println(msg)
    // for _, playlist := range page.Playlists {
    //     fmt.Println("  ", playlist.Name)
    // }
    // example call ^^

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

    log.Fatal(http.ListenAndServe(":8080", &MyServer{r}))

}