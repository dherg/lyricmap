package main

import (
    "log"
    "fmt"
    "net/http"
    "encoding/json"

    "github.com/gorilla/mux"
)

type Pin struct {
    PinId string
    Lat string
    Lng string
}

func pins(pinId string) []Pin {
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

func PinsHandler(w http.ResponseWriter, r *http.Request) {

    // get all pins info
    pinData := pins("")

    fmt.Println(pinData)

    // set header response content type to JSON
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(pinData)

    


}

func LoginHandler(w http.ResponseWriter, r *http.Request) {


}

func main() {

    r := mux.NewRouter()
    r.HandleFunc("/pins", PinsHandler)
    r.HandleFunc("/login", LoginHandler)

    log.Fatal(http.ListenAndServe(":8080", r))

}