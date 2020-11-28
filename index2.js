/* eslint-disable */
; let options = {
  modelUrl: "./data/03.json",
  width: 500,
  height: 500,
  modelColor: 0x04e20f,
  colorChangeArr: [0xff0000, 0x04e20f]
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
    this.rotate_toggle = false
    this.particle_toggle = false
    this.change_color_toggle = false
    this.scan_toggle = false
    this.point_toggle = true
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

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    })
    this.renderer.setClearColor(0x2d2d2d, 0.0)
    this.renderer.setSize(this.width, this.height)
    document.body.appendChild(this.renderer.domElement)
    //初始化辅助工具
    const axesHelper = new THREE.AxesHelper(1000);
    this.scene.add(axesHelper);
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
  },
  //初始化加载模型
  initLoader: function () {
    SeTrUtils.readTextFile(this.modelUrl, (res) => {
      let data = JSON.parse(res)
      let dataArr = data.geometries
      //point坐标保存
      let starsGeometry = new THREE.Geometry();
      //inital坐标保存
      let vertices2 = []
      //根据高度自下而上排序的坐标保存
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
      //点位初始化
      let starsMaterial = new THREE.PointsMaterial({ color: this.modelColor, size: 0.1, transparent: true });
      let starField = new THREE.Points(starsGeometry, starsMaterial);
      //初始化粒子参数
      starField.positions = starField.geometry.vertices
      starField.initialPositions = vertices2
      SeTrUtils.modelToPoint.starField = starField
      SeTrUtils.modelToPoint.scene.add(starField);
    })
    //初始化scan参数
    let scanGeo = new THREE.Geometry()
    for (let i = 0; i < 80; i++) {
      let point = new THREE.Vector3();
      point.x = i - 40
      point.y = 0
      for (let j = 0; j < 80; j++) {
        point.z = j - 40
        scanGeo.vertices.push(point.clone())
      }
    }
    let scanMaterial = new THREE.PointsMaterial({ color: 0xff0000, size: 0.1, transparent: true })
    let scanField = new THREE.Points(scanGeo, scanMaterial)
    this.scanField = scanField
    this.scanField.material.opacity = 0
    this.scanField.toggle = true
    this.scene.add(scanField)
    //初始化点位飞入参数
    let pointGeo = new THREE.Geometry()
    for (let index = 0; index < 10; index++) {
      let pointVec = new THREE.Vector3()
      pointVec.set((Math.random() * 200 - 100), (Math.random() * 200 - 100), (Math.random() * 200 - 100))
      pointGeo.vertices.push(pointVec)
    }
    let pointMaterial = new THREE.PointsMaterial({ color: this.modelColor, size: 5, transparent: true })
    let points = new THREE.Points(pointGeo, pointMaterial);
    points.material.opacity = 0
    this.points = points
    this.scene.add(points)
    console.log(points);
  },
  //渲染函数
  render: function () {
    //获取delta值
    let delta = this.clock.getDelta()
    delta = delta < 2 ? delta : 2 //保证delta小于2

    //修改颜色效果
    if (this.starField && this.change_color_toggle) {
      let material = this.starField.material
      let time = Date.now() * 0.00005;
      let h = (360 * (1.0 + time) % 360) / 360;
      material.color.setHSL(h, 0.5, 0.5);
    }
    //旋转效果
    if (this.starField && this.rotate_toggle) {
      this.starField.rotateY(0.01)
    }
    //point飞入效果
    if (this.starField && this.point_toggle) {
      this.points.material.opacity = 1
      let points = this.points.geometry.vertices
      for (let index = 0; index < points.length; index++) {
        if (points[index].x != 0) {
          if (points[index].x > 0) points[index].x -= 1
          if (points[index].x < 0) points[index].x += 1
        }
        if (points[index].y != 20) {
          if (points[index].y > 20) points[index].y -= 1
          if (points[index].y < 20) points[index].y += 1
        }
        if (points[index].z != 0) {
          if (points[index].z > 0) points[index].z -= 1
          if (points[index].z < 0) points[index].z += 1
        }
      }
      this.points.geometry.verticesNeedUpdate = true;

    }
    //扫描效果
    if (this.starField && this.scan_toggle) {
      this.scanField.material.opacity = 1
      let points = this.scanField.geometry.vertices
      for (let i = 0; i < points.length; i++) {
        if (this.scanField.toggle) {
          if (points[i].y <= 70) {
            points[i].y += 1
          } else {
            this.scanField.toggle = !this.scanField.toggle
            for (let j = 0; j < points.length; j++) {
              points[j].y = 70
            }
          }
        } else {
          if (points[i].y >= -5) {
            points[i].y -= 1
          } else {
            this.scanField.toggle = !this.scanField.toggle
            for (let j = 0; j < points.length; j++) {
              points[j].y = 0
            }
          }
        }
      }
      this.scanField.geometry.verticesNeedUpdate = true;
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
  },
  //animate
  animate: function () {
    requestAnimationFrame(SeTrUtils.modelToPoint.animate)
    SeTrUtils.modelToPoint.render()
    SeTrUtils.modelToPoint.controls.update();
  },
  /*******暴露函数********/
  //旋转开关
  rotate_toggle_fnc () {
    console.log("rotate");
    SeTrUtils.modelToPoint.rotate_toggle = !SeTrUtils.modelToPoint.rotate_toggle
  },
  //颜色变化开关
  change_color_toggle_fnc () {
    console.log("color");
    SeTrUtils.modelToPoint.change_color_toggle = !SeTrUtils.modelToPoint.change_color_toggle
  },
  //扫描效果开关
  scan_toggle_fnc () {
    console.log("scan");
    SeTrUtils.modelToPoint.scan_toggle = !SeTrUtils.modelToPoint.scan_toggle
    if (!SeTrUtils.modelToPoint.scan_toggle) {
      SeTrUtils.modelToPoint.scene.remove(SeTrUtils.modelToPoint.scanField)
    } else {
      SeTrUtils.modelToPoint.scene.add(SeTrUtils.modelToPoint.scanField)
    }
  },
  //粒子效果开关
  particle_toggle_fnc () {
    console.log("particle");
    SeTrUtils.modelToPoint.particle_toggle = !SeTrUtils.modelToPoint.particle_toggle
    //初始化,粒子化的参数
    let starField = SeTrUtils.modelToPoint.starField
    starField.verticesDown = 0
    starField.verticesUp = 0
    starField.direction = 0
    starField.speed = 50
    starField.delay = Math.floor(100 * Math.random())
    starField.start = Math.floor(100 * Math.random())
  },
  //点位飞入开关
  point_toggle_fnc () {
    console.log("point");
    SeTrUtils.modelToPoint.point_toggle = !SeTrUtils.modelToPoint.point_toggle
  }
}
SeTrUtils.modelToPoint.init(options)
// setTimeout(SeTrUtils.modelToPoint.particle_toggle_fnc, 500)

function initEvent () {
  let rotate = document.getElementById("rotate")
  let color = document.getElementById("color")
  let scan = document.getElementById("scan")
  let particle = document.getElementById("particle")
  let point = document.getElementById("point")

  rotate.onclick = function () {
    SeTrUtils.modelToPoint.rotate_toggle_fnc()
  }
  color.onclick = function () {
    SeTrUtils.modelToPoint.change_color_toggle_fnc()
  }
  scan.onclick = function () {
    SeTrUtils.modelToPoint.scan_toggle_fnc()
  }
  particle.onclick = function () {
    SeTrUtils.modelToPoint.particle_toggle_fnc()
  }
  particle.onclick = function () {
    SeTrUtils.modelToPoint.point_toggle_fnc()
  }
}
initEvent()
