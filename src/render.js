import Stats from 'stats-js'
import * as THREE from 'three'
import xolor from 'xolor'
import _ from 'lodash'

export class Render3D {

  // Global
  camera = null
  canvasRef = null
  renderer = null
  scene = null
  statsRef = null
  stats = null

  // 3d elements
  particles = null
  sphere = null
  waves = null

  constructor(canvasRef, statsRef) {
    if (canvasRef) {
      this.canvasRef = canvasRef
      this.init3D()
    }
    if (statsRef) {
      this.statsRef = statsRef
      this.initStats()
    }
  }

  init3D = () => {
    this.scene = new THREE.Scene() // Set the scene containing objects

    this.camera = new THREE.PerspectiveCamera( // Set the camera to look at the scene
      45, // fov
      window.innerWidth / window.innerHeight, // ratio of display
      0.1, // distance step
      1500 // max distance
    )
    this.camera.position.x = -70
    this.camera.position.y = 0
    this.camera.position.z = 0
    this.camera.lookAt(this.scene.position) // Set the direction of the camera based on a position

    this.renderer = new THREE.WebGLRenderer({ // Set the renderer
      antialias: true, // add antialiasing
      alpha: true, // add transparency
    })
    this.renderer.setClearColor(new THREE.Color(0xfdcbf1)) // set the background color of the canvas
    this.renderer.setSize(window.innerWidth, window.innerHeight) // set the size used by the renderer
    this.renderer.shadowMap.enabled = true // activate the shadows
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap // soften shadows

    /**
     * Create a new sphere
     * @param radius
     * @param width segments should be > 3
     * @param height segments should be > 2
     */
    const sphereGeometry = new THREE.SphereGeometry(10, 60, 60)
    sphereGeometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2))
      .mergeVertices()
    this.waves = sphereGeometry.vertices.map(vertice => ({
      ang: Math.random() * Math.PI * 2,
      amp: 1.5 + Math.random() * 3.7,
      speed: 0.01 + Math.random() * 0.02,
      x: vertice.x,
      y: vertice.y,
      z: vertice.z,
    }))
    const texture = new THREE.Texture(this.generateGradient())
    texture.needsUpdate = true
    const sphereMaterial = new THREE.MeshLambertMaterial({
      blending: THREE.NormalBlending,
      map: texture,
      opacity: 0.9,
      transparent: true,
    })
    this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    this.sphere.position.set(0, 0, 0)
    this.sphere.castShadow = true // the element will cast shadow on receptive elements

    /**
     * Create a spotlight
     * @param light color
     */
    const spotLightTop = new THREE.SpotLight(0xa18cd1)
    const spotLightBottom = new THREE.SpotLight(0xfbc2eb)
    const SPOTLIGHT_CONSTANTS = {
      castShadow: true,
      shadow: {
        mapSize: {
          height: 1024,
          width: 1024,
        },
      }
    }
    spotLightTop.position.set(-40, 60, -10)
    spotLightBottom.position.set(-40, -60, -10)
    _.merge(spotLightTop, SPOTLIGHT_CONSTANTS)
    _.merge(spotLightBottom, SPOTLIGHT_CONSTANTS)
    const light = new THREE.AmbientLight(0xffffff, 0.2)

    /**
     * Create some particles
     */
    const colorStart = xolor('#ffecd2')
    const colorEnd = '#ff9a9e'
    const particlesNumber = 10000
    this.particlesWaves = []
    const particlesGeometry = new THREE.Geometry()
    for (let i = 0; i < particlesNumber; i++) {
      const particle = new THREE.Vector3()
      particle.x = Math.random() * 1300 + 200
      particle.y = THREE.Math.randFloatSpread(800)
      particle.z = THREE.Math.randFloatSpread(800)
      particlesGeometry.vertices.push(particle)
      particlesGeometry.colors.push(new THREE.Color(colorStart.gradient(colorEnd, i / particlesNumber).css))
      this.particlesWaves.push(_.extend({}, particle, {
        ang: Math.random() * Math.PI * 2,
        amp: 1.5 + Math.random() * 3.7,
        speed: 0.01 + Math.random() * 0.02,
      }))
    }
    const particlesMaterial = new THREE.PointsMaterial({
        vertexColors: THREE.VertexColors,
    })
    this.particles = new THREE.Points(particlesGeometry, particlesMaterial)

    // add elements to the scene
    this.scene.add(this.sphere)
    this.scene.add(this.particles)
    this.scene.add(spotLightTop)
    this.scene.add(spotLightBottom)
    this.scene.add(light)

    // append to DOM
    this.canvasRef.appendChild(this.renderer.domElement)
    this.update()
  }

  /**
   * Init the fps stats indicator
   */
  initStats = () => {
    this.stats = new Stats()
    this.stats.setMode(0)
    this.stats.domElement.style.position = 'absolute'
    this.stats.domElement.style.top = '0'
    this.stats.domElement.style.left = '0'
    this.statsRef.appendChild(this.stats.domElement)
  }

  /**
   * Update the animation at 60fps
   */
  update = () => {
    const {
      camera,
      renderer,
      scene,
      stats,
      update,
    } = this
    if (stats) {
      stats.update()
    }
    this.animate()
    requestAnimationFrame(update)
    renderer.render(scene, camera)
  }

  /**
   * Animate the elements
   */
   animate = () => {
     const {
       particles,
       particlesWaves,
       sphere,
       waves,
     } = this

     // Sphere animation
     sphere.geometry.vertices = sphere.geometry.vertices.map((vertice, i) => {
       const wave = waves[i]
       vertice.x = wave.x + Math.cos(wave.ang) * wave.amp
      //  vertice.y = wave.y + Math.sin(wave.ang) * wave.amp
      //  vertice.z = wave.z + Math.cos(wave.ang) * Math.sin(wave.ang) * wave.amp
       this.waves[i].ang += wave.speed
       return vertice
     })
     sphere.geometry.verticesNeedUpdate = true

     // Particles animation
     particles.geometry.vertices = particles.geometry.vertices.map((vertice, i) => {
       const wave = particlesWaves[i]
       vertice.x = wave.x + Math.cos(wave.ang) * wave.amp
       vertice.y = wave.y + Math.cos(wave.ang) * wave.amp
       vertice.z = wave.z + Math.cos(wave.ang) * wave.amp
       this.particlesWaves[i].ang += wave.speed
       return vertice
     })
     particles.geometry.verticesNeedUpdate = true
   }

   /**
    * Generate a gradient canvas
    */
   generateGradient = () => {
     const size = 256
     const canvas = document.createElement('canvas')
     canvas.width = size
     canvas.height = size
     const context = canvas.getContext('2d')
     context.rect(0, 0, size, size)
     const gradient = context.createLinearGradient(size / 2, 0, size / 2, size)
     gradient.addColorStop(0, '#fbc2eb')
     gradient.addColorStop(1, '#a18cd1')
     context.fillStyle = gradient
     context.fill()

     return canvas
   }

   /**
    * On resize update canvas
    */
   onResize = () => {
     this.camera.aspect = window.innerWidth / window.innerHeight
     this.camera.updateProjectionMatrix()
     this.renderer.setSize(window.innerWidth, window.innerHeight)
   }

}
