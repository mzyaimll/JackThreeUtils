/* eslint-disable */
; let options = {
  modelUrl: "./data/03.json",
  width: 500,
  height: 500,
  modelColor: 0x04e20f
}
let SeTrUtils = {}
/**
 * 文件异步请求加载工具
 * @param {文件地址} file 
 * @param {回调函数} callback 
 */
SeTrUtils.readTextFile = function (file, callback) {
  let rawFile = new XMLHttpRequest();
  rawFile.overrideMimeType("application/json")
  rawFile.open("GET", file, true);
  rawFile.onreadystatechange = function () {
    if (rawFile.readyState === 4 && rawFile.status == "200") {
      callback(rawFile.responseText);
    }
  }
  rawFile.send(null);
}
/**
 * 模型粒子化显示工具
 * 必须优先调用init()并传入相应的option
 */
SeTrUtils.modelToPoint = {
  init: function (option) {
    this.modelUrl = option.modelUrl
    this.width = option.width || 100
    this.height = option.height || 100
    this.modelColor = option.modelColor || "#ffffff"
    //初始化开关
    this.breath_toggle = false
    this.rotate_toggle = true
    this.particle_toggle = false
    //初始化clock
    this.clock = new THREE.Clock()
    this.begin = 0
    this.initParam()
    this.initLoader()
    this.animate()
  },
  //初始化三维基础变量
  initParam: function () {
    this.scene = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(30, this.width / this.height, 1, 10000)
    this.camera.position.set(-200, 100, 170)
    this.camera.lookAt(new THREE.Vector3(0, 0, 0))

    let directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position = new THREE.Vector3(0, 0, 100)
    this.scene.add(directionalLight);

    let pointLight = new THREE.PointLight(0xff0000, 100, 100)
    pointLight.position.set(0, 10, 0)
    this.scene.add(pointLight)

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    })
    this.renderer.setClearColor(0x2d2d2d, 0.0)
    this.renderer.setSize(this.width, this.height)
    document.body.appendChild(this.renderer.domElement)

    const axesHelper = new THREE.AxesHelper(1000);
    this.scene.add(axesHelper);
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);

    // var renderModel = new THREE.RenderPass(this.scene, this.camera);
    // var effectBloom = new THREE.BloomPass(0.75);
    // var effectFilm = new THREE.FilmPass(0.5, 0.5, 1448, false);

    // effectFocus = new THREE.ShaderPass(THREE.FocusShader);

    // effectFocus.uniforms["screenWidth"].value = window.innerWidth * window.devicePixelRatio;
    // effectFocus.uniforms["screenHeight"].value = window.innerHeight * window.devicePixelRatio;
    // this.composer = new THREE.EffectComposer(this.renderer);

    // this.composer.addPass(renderModel);
    // this.composer.addPass(effectBloom);
    // this.composer.addPass(effectFilm);
    // this.composer.addPass(effectFocus);
  },
  //初始化加载模型
  initLoader: function () {
    SeTrUtils.readTextFile(this.modelUrl, (res) => {
      let data = JSON.parse(res)
      let dataArr = data.geometries
      let starsGeometry = new THREE.Geometry();
      let vertices2 = []
      dataArr.forEach(item => {
        let dataPoints = item.data.attributes.position.array
        for (let i = 0; i < dataPoints.length; i += 3) {
          let star = new THREE.Vector3();
          star.x = dataPoints[i];
          star.y = dataPoints[i + 1];
          star.z = dataPoints[i + 2];
          starsGeometry.vertices.push(star.clone())
          vertices2.push(star.clone())
        }
      })
      let starsMaterial = new THREE.PointsMaterial({ color: this.modelColor, size: 0.1, transparent: true });
      let starField = new THREE.Points(starsGeometry, starsMaterial);
      //初始粒子化参数
      SeTrUtils.modelToPoint.starField = starField
      SeTrUtils.modelToPoint.starField.positions = starField.geometry.vertices
      SeTrUtils.modelToPoint.starField.initialPositions = vertices2
      SeTrUtils.modelToPoint.scene.add(starField);
    })
  },
  //渲染函数
  render: function () {
    //获取delta值
    let delta = this.clock.getDelta()
    delta = delta < 2 ? delta : 2 //保证delta小于2
    //闪烁效果
    if (this.breath_toggle && this.starField) {
      let modelMaterial = this.starField.material
      modelMaterial.opacity = Math.abs(Math.sin((this.begin += 0.005))) / 2
    }
    //旋转效果
    if (this.starField && this.rotate_toggle) {
      this.starField.rotateY(0.01)
    }
    //扫描效果
    if (this.starField && this.scan_toggle) {

    }
    //粒子化效果
    if (this.starField && this.particle_toggle) {
      let data = this.starField
      let positions = this.starField.positions
      let initialPositions = this.starField.initialPositions
      let count = positions.length
      if (data.start > 0) {
        data.start -= 1;
      } else {
        if (data.direction === 0) {
          data.direction = -1;
        }
      }
      if (data.direction < 0) {
        for (let i = 0; i < count; i++) {
          let px = positions[i].x;
          let py = positions[i].y;
          let pz = positions[i].z;
          // falling down
          if (py > 0) {
            this.starField.positions[i].x = px + 1.5 * (0.50 - Math.random()) * data.speed * delta
            this.starField.positions[i].y = py + 3.0 * (0.25 - Math.random()) * data.speed * delta
            this.starField.positions[i].z = pz + 1.5 * (0.50 - Math.random()) * data.speed * delta
          } else {
            data.verticesDown += 1;
          }
        }
      } else if (data.direction > 0) {
        // rising up
        for (let i = 0; i < count; i++) {
          let px = positions[i].x;
          let py = positions[i].y;
          let pz = positions[i].z;
          let ix = initialPositions[i].x;
          let iy = initialPositions[i].y;
          let iz = initialPositions[i].z;
          let dx = Math.abs(px - ix);
          let dy = Math.abs(py - iy);
          let dz = Math.abs(pz - iz);
          let d = dx + dy + dx;
          if (d > 1) {
            positions[i].x = px - (px - ix) / dx * data.speed * delta * (0.85 - Math.random())
            positions[i].y = py - (py - iy) / dy * data.speed * delta * (1 + Math.random())
            positions[i].z = pz - (pz - iz) / dz * data.speed * delta * (0.85 - Math.random())
          } else {
            data.verticesUp += 1;
          }
        }
      }
      // all vertices down
      if (data.verticesDown >= 100 * count) {
        data.direction = 1;
        data.speed = 50;
        data.verticesDown = 0;
        data.delay = 320;
        if (data.delay <= 0) {

        } else {
          data.delay -= 1;
        }
      }
      // all vertices up
      if (data.verticesUp >= count) {
        if (data.delay <= 0) {
          data.direction = - 1;
          data.speed = 50;
          data.verticesUp = 0;
          data.delay = 320;
        } else {
          data.delay -= 1;
        }
      }
      //通知threejs更新坐标
      data.geometry.verticesNeedUpdate = true;
    }
    //render
    this.renderer.render(this.scene, this.camera)
    // this.composer.render(0.01)
  },
  //animate
  animate: function () {
    requestAnimationFrame(SeTrUtils.modelToPoint.animate)
    SeTrUtils.modelToPoint.render()
    SeTrUtils.modelToPoint.controls.update();
  },
  /*******暴露函数********/
  //呼吸灯开关
  breath_toggle_fnc () {
    SeTrUtils.modelToPoint.breath_toggle = !SeTrUtils.modelToPoint.breath_toggle
  },
  //旋转开关
  rotate_toggle_fnc () {
    SeTrUtils.modelToPoint.rotate_toggle = !SeTrUtils.modelToPoint.rotate_toggle
  },
  particle_toggle_fnc () {
    SeTrUtils.modelToPoint.particle_toggle = !SeTrUtils.modelToPoint.particle_toggle
    //初始化,粒子化的参数
    let starField = SeTrUtils.modelToPoint.starField
    starField.verticesDown = 0
    starField.verticesUp = 0
    starField.direction = 0
    starField.speed = 50
    starField.delay = Math.floor(100 * Math.random())
    starField.start = Math.floor(100 * Math.random())
  }
}
SeTrUtils.modelToPoint.init(options)
// setTimeout(SeTrUtils.modelToPoint.particle_toggle_fnc, 500)