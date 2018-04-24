package main

import (
    "log"
    "fmt"
    "net/http"

    "github.com/gorilla/mux"
)

func pins(pinNum uint64) uint64 {
    fmt.Println("received getpin request")
    return pinNum
}

func PinsHandler(w http.ResponseWriter, r *http.Request) {

    pinData := pins(1)
    fmt.Printf("received %d\n", pinData)

}

func LoginHandler(w http.ResponseWriter, r *http.Request) {

}

func main() {

    r := mux.NewRouter()
    r.HandleFunc("/pins", PinsHandler)
    r.HandleFunc("/login", LoginHandler)

    log.Fatal(http.ListenAndServe(":8080", r))

}