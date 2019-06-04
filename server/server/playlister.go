package main

import (
    "context"
    "encoding/csv"
    "errors"
    "fmt"
    "log"
    "os" 
    "net/http"

    "github.com/zmb3/spotify"
    "googlemaps.github.io/maps"
)

// OAuth redirect URI
var redirectURI = os.Getenv("LYRICMAP_API_HOST") + "/api/playlistercallback"

var (
    auth  = spotify.NewAuthenticator(redirectURI, spotify.ScopeUserReadPrivate)
    ch    = make(chan *spotify.Client)
    state = generateID() // generate random string for oauth state
)

// spotify client with credentials for playlister user
var playlisterClient spotify.Client

// Map of state codes -> Spotify playlist IDs
var statePlaylistsMap map[string]string

// geocodeFromLatLng returns the state abbreviation if found for a given lat/lng 
func geocodeFromLatLng(lat float32, lng float32) (string, error) {

    latLng := &maps.LatLng{
        Lat: float64(lat),
        Lng: float64(lng),
    }

    // Filter request to only get state-level result
    geocodeResultTypes := []string{"administrative_area_level_1"}

    c, err := maps.NewClient(maps.WithAPIKey("AIzaSyCIO-07Xg3QCEd3acooGm9trpH4kCZ5TTY"))
    if err != nil {
        log.Fatalf("fatal error: %s", err)
        return "", err
    }
    r := &maps.GeocodingRequest {
        LatLng:      latLng,
        ResultType: geocodeResultTypes,
    }
    geocodingResult, err := c.Geocode(context.Background(), r)
    if err != nil {
        log.Fatalf("fatal error: %s", err)
        return "", err
    }

    if len(geocodingResult) < 1 {
        return "", errors.New("geocodeFromLatLng: length of geocodingResult is < 1")
    } else if len(geocodingResult[0].AddressComponents) < 1 {
        return "", errors.New("geocodeFromLatLng: length of geocodingResult[0].AddressComponents is < 1")
    } else if geocodingResult[0].AddressComponents[0].ShortName == "" {
        return "", errors.New("geocodeFromLatLng: geocodingResult[0].AddressComponents[0].ShortName == \"\"")
    }

    return geocodingResult[0].AddressComponents[0].ShortName, nil
}

func loadStatePlaylistsFile() error {
    statePlaylistsFileName := "../stateplaylists.csv"

    statePlaylistsMap = make(map[string]string)

    f, err := os.Open(statePlaylistsFileName)
    if err != nil {
        panic(err)
        return err
    }
    defer f.Close()

    records, err := csv.NewReader(f).ReadAll()
    if err != nil {
        panic(err)
        return err
    }

    // Add state code / playlist ID pairs to map, skipping first title row
    for _, record := range records {
        statePlaylistsMap[record[1]] = record[2]
    }
    return nil
}

// completeAuth is called by the Spotify callback to retrieve OAuth tokens
func completeAuth(w http.ResponseWriter, r *http.Request) {
    tok, err := auth.Token(state, r)
    if err != nil {
        http.Error(w, "Couldn't get token", http.StatusForbidden)
        log.Println(err)
    }
    if st := r.FormValue("state"); st != state {
        http.NotFound(w, r)
        log.Println("State mismatch: %s != %s\n", st, state)
    }
    // use the token to get an authenticated client
    playlisterClient := auth.NewClient(tok)
    fmt.Fprintf(w, "Login Completed!")
    user, err := playlisterClient.CurrentUser()
    if err != nil {
        log.Println(err)
    }
    fmt.Println("You are logged in as:", user.ID)
    return
}


func setupClient(w http.ResponseWriter, r *http.Request) {

    // check if user is approved
    userID, isAuthenticated, err := checkRequestAuthentication(r)
    if err != nil {
        panic(err)
        return
    }
    if isAuthenticated != true || userID != os.Getenv("PLAYLISTER_ADMIN_ID") {
        // return 403 forbidden
        http.Error(w, "Forbidden", http.StatusForbidden)
        return
    }

    // redirect to Spotify login URL
    url := auth.AuthURL(state)
    http.Redirect(w, r, url, http.StatusFound)

}
