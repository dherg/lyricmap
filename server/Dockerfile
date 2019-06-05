FROM golang:1.10

RUN mkdir -p /server

WORKDIR /server

COPY server/ . 
COPY stateplaylists.csv .

RUN go get -d -v github.com/gorilla/mux
RUN go get -d -v github.com/gorilla/sessions
RUN go get -d -v github.com/gorilla/handlers
RUN go get -d -v github.com/zmb3/spotify
RUN go get -d -v golang.org/x/oauth2/clientcredentials
RUN go get -d -v github.com/lib/pq
RUN go get -d -v googlemaps.github.io/maps

EXPOSE 8080

# RUN go build endpoints.go users.go pins.go

CMD ["go", "run", "endpoints.go", "users.go", "pins.go", "playlister.go"]
