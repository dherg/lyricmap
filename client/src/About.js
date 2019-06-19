import React, { Component } from 'react';

export default class About extends Component {
  render() {
    return (
      <div id="About-Page-Content">
        <p>
                Lyric Map is an effort to visualize lyrical references to places in the real world.
                It's a community effort – if you hear a specific location referenced in your favorite song, drop a pin on the map!
        </p>

        <p> Guidelines: </p>

        <ul>
          <li>
                    The more specific the better! Street intersections, store names, and specific landmark references are best.
                    Exact addresses are hard to come by in song lyrics, but if you can narrow down the spot the artist was talking about, go ahead and add it!
          </li>
          <li>
                    Neighborhood references are about as vague as lyrics references should be. If a song talks about a city or state, but nothing more specific, it's too general to map!
          </li>
          <li>
                    When submitting the lyric, include the location reference and a line or two for context, but not the entire lyrics.
          </li>
        </ul>

        <p>
                When a pin is added in the US, it's also added to a playlist for the relevant state.
          <a href="https://open.spotify.com/user/6zn16q47nwcfj419ndzlio18p?si=5XF98XD_SQqSQ20Rv70reg"> You can listen to those playlists here! </a>
        </p>

        <p>
                Feedback/comments/questions are all welcome!
          {' '}
          <a href="https://github.com/dherg/lyricmap"> Check out the code on Github </a>
          {' '}
and create an issue (or pull request!) if something's broken.
        </p>

      </div>
    );
  }
}
