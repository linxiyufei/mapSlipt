const prvIdMap = {
  '710000': 'taiwan',
  '130000': 'hebei',
  '140000': 'shanxi',
  '150000': 'neimenggu',
  '210000': 'liaoning',
  '220000': 'jilin',
  '230000': 'heilongjiang',
  '320000': 'jiangsu',
  '330000': 'zhejiang',
  '340000': 'anhui',
  '350000': 'fujian',
  '360000': 'jiangxi',
  '370000': 'shandong',
  '410000': 'henan',
  '420000': 'hubei',
  '430000': 'hunan',
  '440000': 'guangdong',
  '450000': 'guangxi',
  '460000': 'hunan',
  '510000': 'sichuan',
  '520000': 'guizhou',
  '530000': 'yunnan',
  '540000': 'xizang',
  '610000': 'shanxi',
  '620000': 'gansu',
  '630000': 'qinghai',
  '640000': 'ningxia',
  '650000': 'xinjiang',
  '110000': 'beijing',
  '120000': 'tianjin',
  '310000': 'shanghai',
  '500000': 'chongqing',
  '810000': 'xianggang',
  '820000': 'aomen',
}

const main = {
  data: () => {
    return {
      prvs: [],
      selectedPrv: 0,
      citys: [],
      selectedCity: 0,
      areas: [],
      selectedArea: 0,
      selectedAreaData: null,
      map: null,
      paths: [],
      isShowData: false,
      dataShow: '',
    };
  },
  created() {
    fetch('./static/map/china.json')
      .then(res => res.json())
      .then(rst => {
        this.prvs = rst.features
      });
  },
  methods: {
    generateUUID() {
      let d = new Date().getTime();
      const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (d + Math.random() * 16) % 16 | 0
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x7 | 0x8)).toString(16);
      });
      return uuid;
    },

    prvChange() {
      if (!this.selectedPrv) { return null }

      fetch(`./static/map/province/${prvIdMap[this.selectedPrv]}.json`)
        .then(res => res.json())
        .then(rst => {
          this.citys = rst.features.map((city) => {
            return { id: city.id, name: city.properties.name }
          })
        })
    },
    cityChange() {
      if (!this.selectedCity) { return null }

      fetch(`./static/map/city/${this.selectedCity}.json`)
        .then(res => res.json())
        .then(rst => {
          this.areas = rst.features.map((area) => {
            return { name: area.properties.name, map: area.geometry.coordinates }
          })
        })
    },
    areaChange() {
      if (!this.selectedArea) { return null }

      let check = false

      this.areas.some((area) => {
        check = area.name === this.selectedArea
        if (check) {
          this.selectedAreaData = area
        }
        return check
      })

      this.get2dPoints()
    },
    get2dPoints() {
      const map = new BMap.Map(document.getElementById('map-holder'))
      const points = []

      this.map = map

      this.selectedAreaData.map.forEach(mapGroup => {
        mapGroup.forEach(mapData => {
          mapData.forEach(pointData => {
            points.push(new BMap.Point(pointData[0], pointData[1]))
          })
        })
      })

      map.enablePinchToZoom()
      map.centerAndZoom(points[0], 13)
      map.addOverlay(new BMap.Polygon(points))
      map.addControl(new BMap.NavigationControl({
        type: BMAP_NAVIGATION_CONTROL_SMALL,
        anchor: BMAP_ANCHOR_TOP_RIGHT,
      }));

      this.addMouseDraw()
    },
    addMouseDraw() {
      const style = {
        strokeColor: 'green',
        fillColor: 'green',
        strokeWeight: 3,
        strokeOpacity: 0.8,
        fillOpacity: 0.4,
        strokeStyle: 'solid',
      }

      const drawManager = new BMapLib.DrawingManager(this.map, {
        isOpen: false,
        enableDrawingTool: true,
        drawingToolOptions: {
          anchor: BMAP_ANCHOR_BOTTOM_LEFT,
          offset: new BMap.Size(5, 5),
        },
        circleOptions: style,
        polylineOptions: style,
        polygonOptions: style,
        rectangleOptions: style,
      })

      this.addDrawingListener(drawManager)
    },
    addDrawingListener(drawManager) {
      const _this = this
      drawManager.addEventListener('overlaycomplete', function (e) {
        const { drawingMode, overlay } = e
        if (drawingMode === BMAP_DRAWING_POLYGON) {
          const points = overlay.getPath()
          const title = prompt('请输入区域名称')
          const pointPixs = points.map(point => [point.lng, point.lat])

          overlay.enableEditing()

          _this.paths.push({
            id: _this.generateUUID(),
            name: title,
            points: pointPixs,
            overlay,
            isShow: true,
          })
          _this.paths = _this.paths
        }
      })
    },
    showData() {
      const data = {
        type: 'FeatureCollection',
        features: [],
      }
      const tmpFeatures = this.paths.filter(p => p.isShow).map(path => {
        return {
          type: 'Feature',
          properties: {
            name: path.name,
          },
          geometry: {
            type: 'MultiPolygon',
            coordinates: [[[...path.points]]],
          },
        }
      })
      data.features = tmpFeatures
      this.dataShow = JSON.stringify(data)
      this.isShowData = true
    },
    downloadData() {
      const blobData = new Blob([this.dataShow])
      const dlLink = document.createElement('a')
      dlLink.download = 'data.json'
      dlLink.style.display = 'none'
      dlLink.href = URL.createObjectURL(blobData)
      document.body.appendChild(dlLink)
      dlLink.click()
      document.body.removeChild(dlLink)
    },
    isShowChange(p) {
      p.isShow = !p.isShow
      this.paths.forEach(path => {
        if (path.isShow) {
          path.overlay.show()
        } else {
          path.overlay.hide()
        }
      })
    },
  },
};

const app = Vue.extend(main);
new app().$mount('#app');
