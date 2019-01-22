package main

import (
    "log"
    "fmt"
    "net/http"
    "encoding/json"
    "io/ioutil"
    "context"
    "os"
    "time"
    "database/sql"
    "math/rand"

    "github.com/gorilla/mux"
    "github.com/gorilla/sessions"
    "github.com/gorilla/handlers"
    "github.com/zmb3/spotify"
    "golang.org/x/oauth2/clientcredentials"

)

type MyServer struct {
    r *mux.Router
}

// for info on fields see https://developers.google.com/identity/sign-in/web/backend-auth
type IDToken struct {
    IDToken string `json:"idtoken"`
    Iss string
    Sub string
    Azp string
    Aud string
    Iat string
    Exp string
    Email string
    Email_verified string
    Name string
    Picture string
    Given_name string
    Family_name string
    Locale string
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

// user session file store TODO: change key, make config var
var sessionStore = sessions.NewCookieStore([]byte(os.Getenv("GORILLA_SESSION_KEY")))

// declare DB connection variable
var db *sql.DB 

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
        _, isAuthenticated, err := checkRequestAuthentication(r)
        if err == nil && isAuthenticated {
            addPins(r)
        } else {
            if err != nil {
                panic(err)
            }
            log.Println("401 Request not authenticated to add pin: ", r)
            w.WriteHeader(http.StatusUnauthorized)
            w.Write([]byte("401: User not authorized to add pin."))
            return
        }
    case "PUT":
        updatePins()
    }
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
    // ensure that it is POST
    if r.Method != "POST" {
        log.Println("Invalid HTTP method for login. Expected POST, got %v" + r.Method)
        w.WriteHeader(http.StatusMethodNotAllowed) // return 405
        w.Write([]byte("405 - login must be a POST request"))
        return
    }

    // get token out of request
    body, err := ioutil.ReadAll(r.Body)
    if err != nil {
        panic(err)
    }
    log.Printf("body = %s", body)
    var token IDToken
    err = json.Unmarshal(body, &token)
    if err != nil {
        panic(err)
    }
    log.Printf("token = %s", token)

    userID, err := validateGoogleToken(token.IDToken) // TODO: get sub from this response to use as the google ID
    // if err != nil, do not log user in. ID is not valid
    if err != nil {
        log.Printf("Token = %s found invalid, not logging in.")
        http.Error(w, "Invalid Google ID", http.StatusUnauthorized)
    }

    // Check to see whether user for this token is registered or not.
    // If not registered, register user
    // check user table for this id
    log.Printf(userID)
    // if userID == "", error out
    if userID == "" {
        log.Printf("403: userID == \"\"")
        http.Error(w, "userID not found", http.StatusUnauthorized)
        return
    }
    row := db.QueryRow(`SELECT FROM users WHERE id = $1`, userID)
    err = row.Scan()
    if err == sql.ErrNoRows { // user is not registered
        log.Printf("user %s is not registered, registering", userID)
        // insert user
        err = registerUser(userID)
        if err != nil {
            panic(err)
        }
    } else if err != nil {
        panic(err)
    }

    // Create session for user
    err = createUserSession(userID, w, r)
    if err != nil {
        panic(err)
    }

    // Write display name in response
    displayName, err := getUserDisplayName(userID)
    if err != nil {
        panic(err)
    }
    // set header response content type to JSON
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(
        struct {
            DisplayName string
        }{
            displayName,
        })

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
                        UserID string
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

    generateID()

    client = getSpotifyClient()

    r := mux.NewRouter()
    r.HandleFunc("/pins", PinsHandler)
    r.HandleFunc("/login", LoginHandler)
    r.HandleFunc("/logout", LogoutHandler)
    r.HandleFunc("/search", SearchHandler)
    r.HandleFunc("/suggest-tracks", suggestTracksHandler)
    r.HandleFunc("/users", UsersHandler)

    // CORS setup
    headersOk := handlers.AllowedHeaders([]string{"X-Requested-With", "Content-Type"})
    originsOk := handlers.AllowedOrigins([]string{os.Getenv("ALLOWED_ORIGINS")})
    methodsOk := handlers.AllowedMethods([]string{"GET", "HEAD", "POST", "PUT", "OPTIONS"})
    credentialsOk := handlers.AllowCredentials()

    log.Println("starting server on port 8080")
    log.Fatal(http.ListenAndServe(":8080", handlers.CORS(originsOk, headersOk, methodsOk, credentialsOk)(&MyServer{r})))

}