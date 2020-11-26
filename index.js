/* eslint-disable */
; let options = {
  modelUrl: "./data/05.json",
  width: 500,
  height: 500,
  modelColor: "#ff0000"
}
let JackUtils = {}
/**
 * 文件异步请求加载工具
 * @param {文件地址} file 
 * @param {回调函数} callback 
 */
JackUtils.readTextFile = function (file, callback) {
  var rawFile = new XMLHttpRequest();
  rawFile.overrideMimeType("application/json")
  console.log(file);;
  rawFile.open("GET", file, true);
  rawFile.onreadystatechange = function () {
    if (rawFile.readyState === 4 && rawFile.status == "200") {
      callback(rawFile.responseText);
    }
  }
  rawFile.send(null);
}
/**
 * model点阵显示工具
 * 必须优先调用init()并传入相应的option
 */
JackUtils.modelToPoint = {
  init: function (option) {
    this.modelUrl = option.modelUrl
    this.width = option.width || 100
    this.height = option.height || 100
    this.modelColor = option.modelColor || "#ffffff"
    this.breath_toggle = true
    this.begin = 0
    this.initParam()
    this.initLoader()
    this.animate()
  },
  //初始化三维基础变量
  initParam: function () {
    this.scene = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(30, this.width / this.height, 1, 10000)
    this.camera.position.set(10, 25, 30)
    this.camera.lookAt(new THREE.Vector3(0, 0, 0))

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position = new THREE.Vector3(0, 0, 100)
    this.scene.add(directionalLight);

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
  },
  //初始化加载模型
  initLoader: function () {
    JackUtils.readTextFile(this.modelUrl, (res) => {
      let data = JSON.parse(res)
      let dataArr = data.geometries
      let starsGeometry = new THREE.Geometry();
      dataArr.forEach(item => {
        let dataPoints = item.data.attributes.position.array
        for (var i = 0; i < dataPoints.length; i += 3) {
          var star = new THREE.Vector3();
          star.x = dataPoints[i];
          star.y = dataPoints[i + 1];
          star.z = dataPoints[i + 2];
          starsGeometry.vertices.push(star)
        }
      })
      let starsMaterial = new THREE.PointsMaterial({ color: 0x04e20f, size: 0.1, transparent: true });
      let starField = new THREE.Points(starsGeometry, starsMaterial);
      JackUtils.modelToPoint.starField = starField
      JackUtils.modelToPoint.scene.add(starField);
      console.log("starField", starField)
    })
  },
  //渲染函数
  render: function () {
    if (this.breath_toggle && this.starField) {
      let modelMaterial = this.starField.material
      modelMaterial.opacity = Math.abs(Math.sin((this.begin += 0.005))) / 2
    }
    if (this.starField) {
      this.starField.rotateY(0.01)
    }
    this.renderer.render(this.scene, this.camera)

  },
  //animate
  animate: function () {
    requestAnimationFrame(JackUtils.modelToPoint.animate)
    JackUtils.modelToPoint.render()
    JackUtils.modelToPoint.controls.update();
  },
  /*******暴露函数********/
  //呼吸灯效果
  breathAnimate () {
    JackUtils.modelToPoint.breath_toggle = !JackUtils.modelToPoint.breath_toggle
  }
}
JackUtils.modelToPoint.init(options)