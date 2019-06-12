import React, { Component } from 'react';

import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

export default class LoadingButton extends Component {
  render() {
    const normalButton = (
      <Button variant={this.props.variant} type="submit">
                Submit Pin
      </Button>
    );

    const loadingButton = (
      <Button variant={this.props.variant} disabled>
        <Spinner
          as="span"
          animation="border"
          size="sm"
          role="status"
          aria-hidden="true"
        />
                Submitting Pin...
      </Button>
    );

    return (this.props.isLoading ? loadingButton : normalButton);
  }
}
