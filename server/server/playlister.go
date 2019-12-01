package main

import (
	"context"
	"encoding/csv"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/zmb3/spotify"
	"googlemaps.github.io/maps"
)

// OAuth redirect URI
var redirectURI = os.Getenv("LYRICMAP_API_HOST") + "/api/playlistercallback"

var (
	auth  = spotify.NewAuthenticator(redirectURI, spotify.ScopePlaylistModifyPublic)
	state = generateID() // generate random string for oauth state
)

// spotify client with credentials for playlister user
var playlisterClient spotify.Client

// Map of state codes -> Spotify playlist IDs
var statePlaylistsMap map[string]string

// checkPlaylisterStatus checks whether the playlisterClient is set up
func checkPlaylisterStatus() error {

	if playlisterClient.AutoRetry != true {
		err := errors.New("playlisterClient not set up")
		log.Println("Playlister: ", err)
		return err
	}

	return nil
}

// addTrackToPlaylist adds a given Spotify track to a given Spotify playlist
func addTrackToPlaylist(trackSpotifyID string, playlistSpotifyID string) error {

	// Check that the Spotify auth is set up before attempting to add
	err := checkPlaylisterStatus()
	if err != nil {
		return(err)
	}

	_, err = playlisterClient.AddTracksToPlaylist(spotify.ID(playlistSpotifyID), spotify.ID(trackSpotifyID))
	if err != nil {
		log.Println("Playlister: Error adding track to playlist: ", err)
		return err
	}

	return nil

}

func addPinToStatePlaylist(p Pin) error {

	// Check validity of track ID in pin
	if p.SpotifyID == "" {
		err := errors.New("playlister: given pin has no spotifyID set")
		return err
	}

	// Reverse geocode to get state abbreviation for pin
	stateCode, err := geocodeFromLatLng(p.Lat, p.Lng)
	if err != nil {
		panic(err)
		return err
	}

	// Lookup state playlistID in statePlaylistsMap
	playlistID := statePlaylistsMap[stateCode]
	if playlistID == "" {
		log.Printf("Didn't find stateCode %v in statePlaylistsMap.", stateCode)
		return nil
	} else {
		log.Printf("Found stateCode %v in map with playlistID %v", stateCode, playlistID)
	}

	err = addTrackToPlaylist(p.SpotifyID, playlistID)
	return err
}

// geocodeFromLatLng returns the state abbreviation if found for a given lat/lng
func geocodeFromLatLng(lat float32, lng float32) (string, error) {

	latLng := &maps.LatLng{
		Lat: float64(lat),
		Lng: float64(lng),
	}

	// Filter request to only get state-level result
	geocodeResultTypes := []string{"administrative_area_level_1"}

	c, err := maps.NewClient(maps.WithAPIKey(os.Getenv("GOOGLE_PLAYLISTER_API_KEY")))
	if err != nil {
		log.Fatalf("fatal error: %s", err)
		return "", err
	}
	r := &maps.GeocodingRequest{
		LatLng:     latLng,
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
	statePlaylistsFileName := os.Getenv("STATE_PLAYLISTS_PATH")

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
	playlisterClient = auth.NewClient(tok)
	playlisterClient.AutoRetry = true
	fmt.Fprintf(w, "Login Completed!")
	user, err := playlisterClient.CurrentUser()
	if err != nil {
		log.Println(err)
	}
	fmt.Println("playlister authentication: logged in as:", user.ID)
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
