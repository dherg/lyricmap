FROM golang:1.10

RUN mkdir -p /server

WORKDIR /server

COPY . . 

RUN go get -d -v github.com/gorilla/mux
RUN go get -d -v github.com/zmb3/spotify
RUN go get -d -v golang.org/x/oauth2/clientcredentials
RUN go get -d -v github.com/lib/pq

RUN go build ./endpoints.go

CMD ["./endpoints"]