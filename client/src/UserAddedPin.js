import React, {Component} from 'react';

import { Link } from 'react-router-dom';


export default class UserAddedPin extends Component {

    constructor(props) {
        super(props);
    }

    render() {

        return(
            <div className="User-Added-Pin">
                <a href={"/pins/" + this.props.pinID}>
                    {this.props.index}
                    {this.props.pinTitle} - {this.props.pinArtist}
                </a>
            </div>
        )
    }

}
