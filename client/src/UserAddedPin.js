import React, {Component} from 'react';

import { Link } from 'react-router-dom';

import ListGroup from 'react-bootstrap/ListGroup'

export default class UserAddedPin extends Component {

    constructor(props) {
        super(props);
    }

    render() {

        return(
                <ListGroup.Item action href={"/pins/" + this.props.pinID}>
                    <b> {this.props.index}.</b> {this.props.pinTitle} - {this.props.pinArtist}
                </ListGroup.Item>
        )
    }

}
