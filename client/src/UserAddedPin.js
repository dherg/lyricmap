import React, {Component} from 'react';

import { Link } from 'react-router-dom';


export default class UserAddedPin extends Component {

    constructor(props) {
        super(props);
    }


    render() {

        return(
            <div className="Header-link">
                <Link to={"/pins/" + this.props.pinID}>
                    ID: {this.props.pinID} Title: {this.props.pinTitle} Artist: {this.props.pinArtist}
                </Link> 
            </div>
        )
    }

}
