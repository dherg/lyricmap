import React, {Component} from 'react';

import ListGroup from 'react-bootstrap/ListGroup'

export default class UserAddedPin extends Component {

    render() {

        return(
                <ListGroup.Item action href={"/pins/" + this.props.pinID}>
                    <b> {this.props.index}.</b> {this.props.pinTitle} - {this.props.pinArtist}
                </ListGroup.Item>
        )
    }

}
