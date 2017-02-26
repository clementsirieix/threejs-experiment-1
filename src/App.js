import React, { Component } from 'react'
import { Render3D } from './render'
import _ from 'lodash'

class App extends Component {

  canvas = null
  render3D = null
  stats = null

  componentDidMount() {
      this.render3D = new Render3D(this.canvas, this.stats)
      window.addEventListener('resize', () => this.render3D.onResize())
  }

  render() {
    return (
      <div className="App">
        <div ref={canvas => this.canvas = canvas} />
        <div ref={stats => this.stats = stats} />
      </div>
    )
  }
}

export default App
