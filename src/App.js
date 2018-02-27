import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

// my imports
import GoogleMapReact from 'google-map-react';
import Pin from './Pin';
import { BrowserRouter as Router, Route, NavLink, IndexRoute, hashHistory, Switch } from 'react-router-dom';
import PropTypes from 'prop-types';

const AnyReactComponent = ({ text }) => <div>{text}</div>;

class About extends Component {
  render() {
    return (
      <div>
        <div className="AboutPage">
          About text here
        </div>
      </div>
    );
  }
}

class NotFound extends Component {
  render() {
    return (
      <div>
        Not Found
      </div>
    );
  }
}

class SimpleMap extends Component {

  constructor(props) {
    super(props);
  }

  getPins() {
    return([
      {lat: 37.027718, lng: -95.625},
      {lat: 35.027718, lng: -95.625}
    ]);
  }

  static defaultProps = {
    center: {lat: 35.027718, lng: -95.625},
    zoom: 5,
    pinCoords: [{lat: 37.027718, lng: -95.625}],
  };

  test() {
    return (
      <Pin lat={59.955413} lng={30.337844} text={'A'}/>
    )
  }

  pinListToComponents(pinList) {
    return (
      pinList.map(pin => <Pin lat={pin.lat} lng={pin.lng}/>)
    );
  }

  render() {


    var pinList = this.getPins();

    console.log(pinList);

    return (
      <div className="SimpleMap">

        <GoogleMapReact
          defaultCenter={this.props.center}
          defaultZoom={this.props.zoom}
          bootstrapURLKeys={{
            key: 'AIzaSyCIO-07Xg3QCEd3acooGm9trpH4kCZ5TTY',
          }}
        >

          {this.pinListToComponents(pinList)}
        </GoogleMapReact>

      </div>
    );
  }
}

class Header extends Component {
  render() {
    return (
      <div className="App-header">
        <div className="Logo-box">
          <div>
            <img src={logo} className="App-logo" alt="logo" />
          </div>
          <div>
            <h1 className="App-title">Lyric Map</h1>
          </div>
        </div>
        <div className="Header-link-box">
          <div className="Header-link">
            <NavLink to="random">Random</NavLink> 
          </div>
          <div className="Header-link">
            <NavLink to="about">About</NavLink> 
          </div>
          <div className="Header-link">
            <h3>Search-bar</h3>
          </div>
        </div>
      </div>
    ); // close return
  } // close render()
}


// class App extends Component {
//   render() {
//     return (
//       <div>
//         <div className="App">
//            <Header />
//         </div>
//         <div className="SimpleMap">
//           <SimpleMap />
//         </div>
//       </div>
//     ); // close return
//   } // close render()
// }

class AppRouter extends Component {
  render() {
    return (
      <Router>
        <div>
          <Header />
          <Switch>
            <Route path="/about" component={About} />
            <Route exact path="/" component={SimpleMap} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </Router>

    );
  }
}

export default AppRouter;
