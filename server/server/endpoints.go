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

    // // search for album info (year)
    // results, err := client.Search("", spotify.SearchTypeAlbum)
    // if err != nil {
    //     log.Println("Error searching Spotify track info: ", err)
    //     return err
    // }

    // // handle album results
    // if results.Albums != nil {
    //     fmt.Println("Albums:")
    //     for _, item := range results.Albums.Albums {
    //         fmt.Println("   ", item.Name)
    //     }
    // }
    // // handle playlist results
    // if results.Playlists != nil {
    //     fmt.Println("Playlists:")
    //     for _, item := range results.Playlists.Playlists {
    //         fmt.Println("   ", item.Name)
    //     }
    // }

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

// suggestTracks
func suggestTracks(query string) []Pin {
    // return mock data TODO: search spotify and return real data
    retPins := []Pin{
                        {SpotifyTitle: "Dance Music", SpotifyArtist: "The Mountain Goats", SmallImageURL: "https://i.scdn.co/image/3a193a8684046d2cce14579aae9d387bd00f3407"},
                        {SpotifyTitle: "Dance Music", SpotifyArtist: "The Mountain Goats", SmallImageURL: "https://i.scdn.co/image/3a193a8684046d2cce14579aae9d387bd00f3407"},
                        {SpotifyTitle: "Dance Music", SpotifyArtist: "The Mountain Goats", SmallImageURL: "https://i.scdn.co/image/3a193a8684046d2cce14579aae9d387bd00f3407"},
                        {SpotifyTitle: "Dance Music", SpotifyArtist: "The Mountain Goats", SmallImageURL: "https://i.scdn.co/image/3a193a8684046d2cce14579aae9d387bd00f3407"},
                        {SpotifyTitle: "Dance Music", SpotifyArtist: "The Mountain Goats", SmallImageURL: "https://i.scdn.co/image/3a193a8684046d2cce14579aae9d387bd00f3407"},
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