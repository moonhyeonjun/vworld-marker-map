let vmap; // Vworld Map 객체
let div_vmap; // HTML div를 가리킬 변수
let selectedFeature = null; // 현재 선택된 feature
let defaultIconStyle; // 기본 아이콘 스타일

/* 지도 초기화 및 기본 설정 */
function initMap() {
  div_vmap = document.getElementById("v_map");

  // Vworld 객체 생성
  vmap = new vw.ol3.Map(div_vmap, getMapOptions());

  // 기본 아이콘 스타일 설정
  defaultIconStyle = createIconStyle("./icons/icon_map-marker.png", (anchor = [0.5, 90]), (scale = 0.2));

  // 클릭 이벤트 설정
  vmap.on("click", handleMapClick);
}

/* Vworld 지도 옵션 설정 */
function getMapOptions() {
  return {
    basemapType: vw.ol3.BasemapType.GRAPHIC,
    controlDensity: vw.ol3.DensityType.EMPTY,
    interactionDensity: vw.ol3.DensityType.BASIC,
    controlsAutoArrange: true,
    homePosition: vw.ol3.CameraPosition,
    initPosition: vw.ol3.CameraPosition,
    logo: false, // 하단 로고 설정. true : 표출, false : 미표출
    navigation: true, // 오른쪽 상단 네비게이션 설정. true : 표출, false : 미표출
  };
}

/* 지도 데이터 로드 */
function loadMapData() {
  handleCoordinates(coordinates);
}

/* 좌표를 처리하는 함수 */
const handleCoordinates = (coordinates) => {
  const defaultCoordinate = [127.3, 35.9];
  const zoomLevel = 7.45;

  showIconsOnMap(coordinates);
  moveMapToCoordinate(defaultCoordinate, zoomLevel);
};

/* 지도에 아이콘 표시 */
function showIconsOnMap(coordinates) {
  const features = createFeatures(coordinates);
  addLayerToMap(features, "vmap_layer");
}

/* 특정 좌표로 지도 이동 */
function moveMapToCoordinate(coordinate, zoom) {
  /**
   * 좌표 시스템에 대한 설명
   *
   * 1. EPSG:4326 (WGS 84)
   *    - WGS 84 (World Geodetic System 1984) 좌표 시스템으로, 지구의 위도(Latitude)와 경도(Longitude)를 기반으로 한 지리적 좌표 시스템입니다.
   *    - 위도 (Latitude): 북/남쪽 방향 (−90에서 +90 사이)
   *    - 경도 (Longitude): 동/서쪽 방향 (−180에서 +180 사이)
   *
   * 2. EPSG:3857 (Web Mercator)
   *    - Web Mercator 좌표 시스템은 인터넷에서 지도를 표시하기 위한 고정된 투영 방식입니다.
   *    - 이 방식은 메르카토르 투영법(Mercator Projection)을 사용하여 지구를 평면으로 나타냅니다.
   *    - 경도와 위도를 직선 거리로 변환하여 지도 상에 표시합니다.
   *    - 구글 맵, OpenStreetMap, Bing 맵 등 웹 기반 지도 서비스에서 주로 사용되는 좌표 시스템입니다.
   *    - 지구의 표면을 표현하는 것보다 화면 상에서의 편리한 표시에 초점을 맞추어, 특정 지역을 잘 표현할 수 있습니다. 다만, 극지방의 왜곡이 큽니다.
   *
   * 3. 좌표 변환:
   *    - EPSG:4326 좌표 시스템에서 GPS 데이터를 받아오면, 이를 EPSG:3857으로 변환하여 화면에 정확하게 표시해야 합니다.
   *    - 변환 함수: ol.proj.transform() 함수를 사용하여 좌표 변환을 수행합니다.
   */

  vmap.getView().setCenter(ol.proj.transform(coordinate, "EPSG:4326", "EPSG:3857"));
  vmap.getView().setZoom(zoom);
}

/* feature 배열 생성 */
function createFeatures(coordinates) {
  return coordinates.map((coordinate) => {
    const feature = new ol.Feature({
      geometry: new ol.geom.Point(
        ol.proj.transform([coordinate.longitude, coordinate.latitude], "EPSG:4326", "EPSG:3857")
      ),
    });

    feature.set("id", coordinate.id);
    feature.setStyle(defaultIconStyle);
    return feature;
  });
}

/* 새로운 레이어 추가 */
function addLayerToMap(features, layerId) {
  removeLayerById(layerId);

  const vectorLayer = new ol.layer.Vector({
    source: new ol.source.Vector({ features: features, id: layerId }),
    id: layerId,
  });

  vmap.addLayer(vectorLayer);
}

/* 특정 ID의 레이어 제거 */
function removeLayerById(layerId) {
  vmap.getLayers().forEach((layer) => {
    if (layer.get("id") === layerId) {
      vmap.removeLayer(layer);
    }
  });
}

/* 지도 클릭 이벤트 처리 */
function handleMapClick(evt) {
  const pixel = evt.pixel;
  vmap.forEachFeatureAtPixel(pixel, (feature) => changeIcon(feature));
}

/* 아이콘 변경 */
function changeIcon(clickedFeature) {
  if (selectedFeature) {
    selectedFeature.setStyle(defaultIconStyle); // 이전 아이콘 기본 스타일로 변경
  }

  if (selectedFeature === clickedFeature) {
    selectedFeature = null;
    return;
  }

  clickedFeature.setStyle(
    createIconStyle("./icons/icon_map-click.png", [0.5, 400], 0.05) // 클릭된 아이콘 스타일
  );
  selectedFeature = clickedFeature;
}

/* 아이콘 스타일 생성 (크기와 앵커 조정) */
function createIconStyle(src, anchor = [0.5, 25], scale = 1) {
  return new ol.style.Style({
    image: new ol.style.Icon({
      anchor: anchor,
      anchorXUnits: "fraction",
      anchorYUnits: "pixels",
      src: src,
      scale: scale,
    }),
  });
}

initMap(); // 지도 초기화 함수 호출
loadMapData(); // 지도 데이터 로드 함수 호출
