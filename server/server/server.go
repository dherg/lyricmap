package main

import (
    "fmt"
    "net/http"
)

func pin(pinNum uint64) uint64 {
    fmt.Println("received getpin request")
    return pinNum
}

func pinHandler(w http.ResponseWriter, r *http.Request) {

    pinData := pin(1)
    fmt.Printf("received %d\n", pinData)

}

func main() {

    http.HandleFunc("/pin", pinHandler)
    fmt.Println("Listening on http://localhost:8000")
    http.ListenAndServe(":8000", nil)

}