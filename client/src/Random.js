import React, {Component} from 'react';

export default class Random extends Component {

    constructor(props) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        console.log('yaya in Random');
        console.log(this.props);
        this.props.handleRandomClick();
    }

    render() {

        console.log('in Random');
        console.log('this.props.handleRandomClick = ');
        console.log(this.props.handleRandomClick);

        return (
            <div onClick={this.handleClick}>
                Random Pin
            </div>
        );
    }
}