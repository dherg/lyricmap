package main

import (
    "log"
    "fmt"
    // "strings"
    "net/http"
    "encoding/json"
    "io/ioutil"

    "github.com/gorilla/mux"
)

type Pin struct {
    PinId string
    Lat string
    Lng string
    Title string
    Artist string
    Lyric string
}

type MyServer struct {
    r *mux.Router
}

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
        retPins := []Pin{{PinId: "1", Lat: "37.027718", Lng: "-95.625"},
                         {PinId: "2", Lat: "35.027718", Lng: "-95.625"},
                         {PinId: "3", Lat: "38.904510", Lng: "-77.050137"}}

        return retPins
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
    
}

func updatePins() {

}

func PinsHandler(w http.ResponseWriter, r *http.Request) {

    // route differently based on request type (r.Method)
    // GET: getPins
    // POST: addPins
    // PUT: updatePins

    fmt.Println(r.Method + " " + r.RequestURI)


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

func main() {

    r := mux.NewRouter()
    r.HandleFunc("/pins", PinsHandler)
    r.HandleFunc("/login", LoginHandler)
    r.HandleFunc("/search", SearchHandler)

    log.Fatal(http.ListenAndServe(":8080", &MyServer{r}))

}