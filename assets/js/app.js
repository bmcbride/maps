var $$ = Dom7;

var app = new Framework7({
  root: "#app",
  theme: "md",
  init: false,
  touch: {
    tapHold: true,
    disableContextMenu: false
  },
  view: {
    stackPages: true,
    pushState: true,
    pushStateOnLoad: true
  },
  routes: [{
    name: "home",
    path: "/",
    url: "index.html",
  }, {
    name: "info",
    path: "/info/",
    popup: {
      el: "#info-popup",
    }
  }, {
    name: "map",
    path: "/map/",
    popup: {
      el: "#map-popup",
      on: {
        close: function() {
          app.popover.close();
          app.toast.close();
          app.measure.clearMeasure();
        },
        closed: function() {
          $$("#map-title").html("");
          app.geolocation.setTracking(false);
          app.layers.image.setVisible(false);
        },
        open: function() {
          app.preloader.show();
        },
        opened: function(e) {
          $$("#gps-btn").removeClass("disabled");
          app.geolocation.setTracking(true);
          if (app.activeLayer) {
            app.functions.setMap(app.activeLayer.toString());  
          } else if (sessionStorage.getItem("settings")) {
            var settings = JSON.parse(sessionStorage.getItem("settings"));
            app.functions.setMap(settings.activeLayer, settings);
            if (settings.basemap) {
              $$("input[type=radio][name=basemap][value='" + settings.basemap + "']").prop("checked", true).trigger("change");
            }
          }
        }
      }
    }
  }],
  on: {
    init: function() {
      app.functions.iosChecks();
      app.functions.loadSavedMaps();
      app.functions.loadAvailableMaps();
      if (window.location.hash.substr(2) == "/map/") {
        if (!sessionStorage.getItem("settings")) {
          setTimeout(function() {
            app.views.main.router.back();
          }, 300);
        }
      }
    },
    sortableEnable: function(listEl) {
      $$("#sort-icon").html("save");
    },
    sortableDisable: function(listEl) {
      $$("#sort-icon").html("sort");
      app.functions.orderList();
    }
  }
});

app.mapStore = localforage.createInstance({
  name: "maps",
  storeName: "saved_maps"
});

app.layers = {
  position: new ol.Feature(),
  image: new ol.layer.Image({
    zIndex: 10
  }),
  measure: new ol.layer.Vector({
    updateWhileInteracting: true,
    zIndex: 12,
    source: new ol.source.Vector({}),
    style: function (feature, resolution) {
      if (feature.getGeometry().getType() == "LineString") {
        return new ol.style.Style({
          text: new ol.style.Text({
            text: feature.getGeometry().getLength() ? app.measure.formatLength(feature.getGeometry().getLength()) : "",
            font: "bold 14px 'Open Sans', 'Arial Unicode MS', 'sans-serif'",
            placement: "line",
            offsetY: -10,
            fill: new ol.style.Fill({
              color: "black"
            }),
            stroke: new ol.style.Stroke({
              color: "white",
              width: 3
            })
          }),
          stroke: new ol.style.Stroke({
            color: "#3a84df",
            lineDash: [0, 10, 0, 10],
            width: 6
          })
        });
      } else if (feature.getGeometry().getType() == "Point") {
        return new ol.style.Style({
          image: new ol.style.Circle({
            radius: 6,
            fill: new ol.style.Fill({
              color: "#fff"
            }),
            stroke: new ol.style.Stroke({
              color: "#3a84df",
              width: 1.5
            })
          })
        });
      }
    }
  }),
  basemaps: {
    osm: new ol.layer.Tile({
      source: new ol.source.XYZ({
        url: "https://{a-c}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        attributions: "© <a href='http://openstreetmap.org' class='external'>OpenStreetMap</a> contributors, © <a href='https://carto.com/attribution' class='external'>CARTO</a> |"
      })
    }),
    topo: new ol.layer.Tile({
      source: new ol.source.XYZ({
        url: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}",
        attributions: "<a href='https://www.doi.gov' class='external'>U.S. Department of the Interior</a> | <a href='https://www.usgs.gov' class='external'>U.S. Geological Survey</a> | <a href='https://www.usgs.gov/laws/policies_notices.html' class='external'>Policies</a> |",
        maxZoom: 16
      })
    }),
    mbStreets: new ol.layer.Tile({
      source: new ol.source.XYZ({
        url: "https://api.mapbox.com/styles/v1/mapbox/streets-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYnJ5bWNicmlkZSIsImEiOiJXN1NuOFFjIn0.3YNvR1YOvqEdeSsJDa-JUw",
        attributions: "© <a href='https://www.mapbox.com/map-feedback/' class='external'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright' class='external'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' class='external'>Improve this map</a></strong> |"
      })
    }),
    mbSatellite: new ol.layer.Tile({
      source: new ol.source.XYZ({
        url: "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYnJ5bWNicmlkZSIsImEiOiJXN1NuOFFjIn0.3YNvR1YOvqEdeSsJDa-JUw",
        attributions: "© <a href='https://www.mapbox.com/map-feedback/' class='external'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright class='external''>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' class='external'>Improve this map</a></strong> |"
      })
    }),
    mbHybrid: new ol.layer.Tile({
      source: new ol.source.XYZ({
        url: "https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v10/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYnJ5bWNicmlkZSIsImEiOiJXN1NuOFFjIn0.3YNvR1YOvqEdeSsJDa-JUw",
        attributions: "© <a href='https://www.mapbox.com/map-feedback/' class='external'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright' class='external'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' class='external'>Improve this map</a></strong> |"
      })
    }),
    mbOutdoors: new ol.layer.Tile({
      source: new ol.source.XYZ({
        url: "https://api.mapbox.com/styles/v1/mapbox/outdoors-v10/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYnJ5bWNicmlkZSIsImEiOiJXN1NuOFFjIn0.3YNvR1YOvqEdeSsJDa-JUw",
        attributions: "© <a href='https://www.mapbox.com/map-feedback/' class='external'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright' class='external'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' class='external'>Improve this map</a></strong> |"
      })
    })
  }
};

app.geolocation = new ol.Geolocation({
  trackingOptions: {
    maximumAge: 10000,
    enableHighAccuracy: true,
    timeout: 600000
  }
});

app.measure = {
  measuring: false,
  measurement: 0,
  formatLength: function(length) {
    var meters = length * app.map.getView().getProjection().getMetersPerUnit();
    var feet = meters * 3.2808;
    var output;
    if (feet > 1320) {
      output = (feet * 0.00018939).toFixed(2) + " " + "mi";
    } else {
      output = feet.toFixed(0) + " " + "ft";
    }
    return output;
  },
  measureClickListener: function() {
    if (app.measure.measuring) {
      app.measure.addSegment();
    } else {
      app.measure.startMeasure();
    }
  },
  startMeasure: function() {
    app.measure.measuring = true;
    var center = app.map.getView().getCenter();
    var point = new ol.Feature(new ol.geom.Point(center));
    app.layers.measure.getSource().addFeature(point);

    var origin = center;
    var target = center;
    var coord = [origin, target];
    app.measure.line = new ol.geom.LineString(coord);
    var feature = new ol.Feature(app.measure.line);
    app.layers.measure.getSource().addFeature(feature);

    app.measure.drawLine = function() {
      target = app.map.getView().getCenter();
      coord = [origin, target];
      app.measure.line.setCoordinates(coord);
    };

    app.map.on("postrender", app.measure.drawLine);
  },
  addSegment: function() {
    app.measure.measurement += app.measure.line.getLength();
    app.map.un("postrender", app.measure.drawLine);
    app.measure.startMeasure();
    $$(".toast-text").html("Total length: " + app.measure.formatLength(app.measure.measurement));
  },
  clearMeasure: function() {
    app.measure.measurement = 0;
    app.layers.measure.getSource().clear();
    app.map.un("postrender", app.measure.drawLine);
    app.map.un("click", app.measure.measureClickListener);
    $$(".crosshair").css("visibility", "hidden");
    $$(".toast-text").html("Tap to add measurement segments.");
  }
};

app.map = new ol.Map({
  target: "map",
  logo: null,
  controls: ol.control.defaults({
    zoom : false,
    rotate: false,
    attributionOptions: {
      collapsible: false,
      collapsed: false
    }
  }),
  layers: [
    app.layers.image,
    app.layers.measure,
    new ol.layer.Vector({
      zIndex: 15,
      source: new ol.source.Vector({
        features: [app.layers.position]
      }),
      style: new ol.style.Style({
        image: new ol.style.Circle({
          radius: 8,
          fill: new ol.style.Fill({
            color: "#3a84df"
          }),
          stroke: new ol.style.Stroke({
            color: "#fff",
            width: 1.5
          })
        })
      })
    })
  ]
});

app.functions = {
  launchGmaps: function() {
    var coords = ol.proj.transform(app.map.getView().getCenter(), app.map.getView().getProjection().getCode(), "EPSG:4326");
    var zoom = app.map.getView().getZoom();
    var url = "https://www.google.com/maps/@?api=1&map_action=map&center="+coords[1]+","+coords[0]+"&zoom="+Math.round(zoom);
    window.open(url);
  },

  startMeasurement: function(){
    app.toast.create({
      text: "Tap to add measurement segments.",
      closeButton: true,
      on: {
        close: function () {
          app.measure.clearMeasure();
        },
        open: function() {
          $$(".crosshair").css("visibility", "visible");
          app.map.on("click", app.measure.measureClickListener);
        }
      }
    }).open();
  },

  calculateStorage: function(bytes) {
    var kb = bytes / 1000;
    if (kb > 1000) {
      return (kb / 1000).toFixed(2) + " MB";
    } else {
      return kb.toFixed(0) + " KB";
    }
  },

  orderList: function() {
    $$("#device-list li a").each(function(i) {
      var key = $$(this).attr("data-key");
      app.mapStore.getItem(key).then(function (item) {
        item.order = i;
        app.mapStore.setItem(key, item);
      }).catch(function(err) {
        console.log(err);
      });
    });
  },

  increaseOpacity: function() {
    var slider = app.range.get(".range-slider");
    slider.setValue(slider.getValue() + 5);
  },

  decreaseOpacity: function() {
    var slider = app.range.get(".range-slider");
    slider.setValue(slider.getValue() - 5);
  },

  iosChecks() {
    if (app.device.ios) {
      if (parseFloat(app.device.osVersion) < 11.3) {
        app.dialog.alert("This app is not fully supported on devices running iOS < 11.3.", "Warning");
      }
      if (!app.device.standalone) {
        if (!localStorage.getItem("dismissPrompt")) {
          app.toast.create({
            text: "Tap the <img src='assets/img/ios-share.png' height='18px'> button " + (app.device.ipad ? "at the top of the screen" : "below") + " to Add to Home Screen.",
            closeButton: true,
            position: app.device.ipad ? "center" : "bottom",
            on: {
              close: function () {
                localStorage.setItem("dismissPrompt", true);
              }
            }
          }).open(); 
        } 
      }
    }
  },

  loadAvailableMaps() {
    if (navigator.onLine) {
      $$("#map-list").empty();
      app.request({
        url: localStorage.getItem("mapConfig") ? localStorage.getItem("mapConfig") : "maps.json",
        method: "GET",
        dataType: "json",
        cache: false,
        success: function (map) {
          map.sort(function(a, b) {
            return (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0;
          });
          for (var i = 0; i < map.length; i++) {
            var config = JSON.stringify(map[i]);
            var li = `<li>
              <a href="#" class="item-link item-content no-chevron" onclick='app.functions.saveMap(${config});'>
                <div class="item-inner">
                  <div class="item-title">
                    ${map[i].name}
                    <div class="item-footer">${map[i].description}</div>
                  </div>
                  <div class="item-after">
                    <span class="badge">${map[i].size}</span>
                  </div>
                </div>
              </a>
            </li>`;
            $$("#map-list").append(li);
          }
          app.ptr.done();
        }
      });
    } else {
      app.ptr.done();
    }
  },

  setMap: function(key, settings) {
    // app.progressbar.show("white");
    $$("#rotate-btn").css("display", "none");
    app.mapStore.getItem(key).then(function(value) {
      $$("#map-title").html(value.name);
      var blob = new Blob([value.image]);

      proj4.defs(value.projection[0],value.projection[1]);
      ol.proj.proj4.register(proj4);

      app.layers.image.setSource(
        new ol.source.ImageStatic({
          url: window.URL.createObjectURL(blob),
          projection: value.projection[0],
          imageExtent: value.extent,
          attributions: value.attribution.replace("<a", "<a class='external'")
        })
      );

      app.layers.image.setExtent(value.extent);

      app.map.setView(
        new ol.View({
          projection: value.projection[0]/*,
          extent: value.extent*/
        })
      );

      app.map.getView().fit(value.extent, {
        constrainResolution: false
      });

      app.map.getView().on("change:rotation", function(evt) {
        var radians = evt.target.getRotation();
        var degrees = radians * 180 / Math.PI;
        $$("#rotate-icon").css("transform", "translate(-12px, -12px) rotate("+degrees+"deg)");
        if (radians == 0) {
          $$("#rotate-btn").css("display", "none");
        } else {
          $$("#rotate-btn").css("display", "block");
        }
      });

      app.geolocation.setProjection(app.map.getView().getProjection());

      if (settings && settings.opacity) {
        app.layers.image.setOpacity(settings.opacity);
      }

      if (settings && settings.state) {
        app.map.getView().setCenter(settings.state.center);
        app.map.getView().setZoom(settings.state.zoom);
        app.map.getView().setRotation(settings.state.rotation);
      } else {
        app.map.getView().fit(value.extent, {
          constrainResolution: false
        });
      }

      app.layers.image.setVisible(true);
      app.map.updateSize();
      // app.progressbar.hide();
      app.preloader.hide();

      sessionStorage.setItem("settings", JSON.stringify({
        activeLayer: key,
        basemap: ($$("input[name='basemap']:checked").val() != "none") ? $$("input[name='basemap']:checked").val() : null,
        opacity: app.layers.image.getOpacity(),
        state: app.map.getView().getState()
      }));
    }).catch(function(err) {
      app.dialog.alert(err, "Map load error");
    });
  },

  loadSavedMaps: function() {
    $$("#device-list").empty();
    var totalStorage = 0;
    var maps = [];
    app.mapStore.iterate(function(value, key, iterationNumber) {
      totalStorage += value.image.byteLength;
      var size = app.functions.calculateStorage(value.image.byteLength);
      value.key = key;
      value.size = size;
      maps.push(value);
    }).then(function() {
      maps.sort(function(a, b) {
        return a.order - b.order;
      });
      for (var i = 0; i < maps.length; i++) {
        var li = `<li class="saved-map">
          <a href="#" class="item-link item-content no-chevron" name="map" data-key="${maps[i].key}" onclick="app.activeLayer = ${maps[i].key}; app.router.navigate('/map/');">
            <div class="item-inner">
              <div class="item-title">
                ${maps[i].name}
                <div class="item-footer">${maps[i].description}</div>
              </div>
              <div class="item-after">
                <span class="badge color-blue">${maps[i].size}</span>
              </div>
            </div>
          </a>
          <div class="sortable-handler"></div>
        </li>`;
        $$("#device-list").append(li);
      }
      if (maps.length > 0) {
        $$("#total-storage").html(app.functions.calculateStorage(totalStorage));
        app.tab.show("#device-view");
      } else {
        $$("#total-storage").html("0");
        $$("#device-list").append(`<li>
          <a href="#" class="item-link item-content no-chevron" onclick="app.tab.show('#list-view');">
            <div class="item-media">
              <i class="icon material-icons">add</i>
            </div>
            <div class="item-inner">
              <div class="item-title">Save a map to your device</div>
            </div>
          </a>
        </li>`);
      }
    }).catch(function(err) {
      app.dialog.alert("Error loading saved maps!", "Load error");
    });
  },

  saveMap: function(config) {
    if (navigator.onLine) {
      app.dialog.confirm("Save <b>" + config.name + "</b> to your device?", "Confirm", function() {
        app.dialog.progress("Downloading map...");
  
        app.request({
          url: config.url,
          method: "GET",
          cache: false,
          xhrFields: {
            responseType: "arraybuffer"
          },
          success: function (image) {
            var key = new Date().getTime().toString();
            var value = {
              "order": $$("#device-list li").length,
              "name": config.name,
              "description": config.description,
              "attribution": config.attribution,
              "projection": config.projection,
              "extent": config.extent,
              "image": image
            };
            app.mapStore.setItem(key, value).then(function (value) {
              app.dialog.close();
              app.toast.create({
                text: "Map saved!",
                closeTimeout: 2000,
                closeButton: true
              }).open();
              app.functions.loadSavedMaps();
            }).catch(function(err) {
              app.dialog.alert("Error saving map!", "Save error");
            });
          }
        });
      });
    } else {
      app.dialog.alert("Network connection required to save map!", "Save error");
    }
  },

  deleteMap: function(key) {
    app.dialog.confirm("Are you sure you want to remove this map from your device?", "Remove map", function() {
      sessionStorage.removeItem("settings");
      app.mapStore.removeItem(key).then(function () {
        app.functions.loadSavedMaps();
      });
    });
  },

  deleteAllMaps: function(){
    app.dialog.confirm("Are you sure you want to remove all saved maps from your device?", "Remove saved maps", function() {
      sessionStorage.removeItem("settings");
      localStorage.removeItem("dismissPrompt");
      app.mapStore.clear().then(function() {
        app.functions.loadSavedMaps();
      });
    });
  },

  setMapConfig() {
    app.dialog.create({
      title: "Maps source",
      content: '<div class="dialog-input-field item-input"><div class="item-input-wrap"><input id="maps-url" type="text" class="dialog-input" onClick="this.select();"></div></div>',
      closeByBackdropClick: true,
      buttons: [{
          text: "Reset",
          onClick: function(dialog, e) {
            localStorage.setItem("mapConfig", "maps.json");
            app.functions.loadAvailableMaps();
          }
        }, {
          text: "OK",
          bold: true,
          onClick: function(dialog, e) {
            url = $$("#maps-url").val();
            if (url) {
              localStorage.setItem("mapConfig", url);
            } else {
              localStorage.removeItem("mapConfig");
            }
            app.functions.loadAvailableMaps();
          }
        }
      ],
      on: {
        opened: function() {
          if (localStorage.getItem("mapConfig")) {
            $$("#maps-url").val(localStorage.getItem("mapConfig"));
          } else {
            $$("#maps-url").val("maps.json");
          }
        }
      }
    }).open();
  }
}

app.once("popoverOpen", function (e) {
  var range = app.range.create({
    el: ".range-slider",
    min: 0,
    max: 100,
    step: 1,
    value: app.layers.image.getOpacity() * 100,
    on: {
      change: function (e) {
        var opacity = e.value / 100;
        app.layers.image.setOpacity(opacity);
        app.map.render();
        var settings = JSON.parse(sessionStorage.getItem("settings"));
        settings.opacity = opacity;
        sessionStorage.setItem("settings", JSON.stringify(settings));
      }
    }
  });
});

app.map.on("moveend", function(evt) {
  var settings = JSON.parse(sessionStorage.getItem("settings"));
  settings.state = app.map.getView().getState(window.devicePixelRatio);
  sessionStorage.setItem("settings", JSON.stringify(settings));
});

app.geolocation.on("error", function(error) {
  app.dialog.alert(error.message, "Geolocation error");
  $$("#gps-icon").html("gps_not_fixed");
  $$("#gps-btn").addClass("disabled");
});

app.geolocation.on("change:position", function() {
  $$("#gps-icon").html("gps_fixed");
  var coordinates = app.geolocation.getPosition();
  var heading = app.geolocation.getHeading() || 0;
  var speed = app.geolocation.getSpeed() || 0;
  app.layers.position.setGeometry(coordinates ? new ol.geom.Point(coordinates) : null);
});

$$("input[type=radio][name=basemap]").change(function() {
  var settings = JSON.parse(sessionStorage.getItem("settings"));
  for (var key in app.layers.basemaps) {
    if (key == this.value && key != "none") {
      app.map.addLayer(app.layers.basemaps[key]);
      settings.basemap = key;
    } else {
      app.map.removeLayer(app.layers.basemaps[key]);
    }
  }
  if (this.value == "none") {
    settings.basemap = null;
  }
  sessionStorage.setItem("settings", JSON.stringify(settings));
});

$$(document).on("contextmenu", "label, a", function(e){
  e.preventDefault();
});

$$(document).on("taphold", ".saved-map", function(e) {
  var id = $$(this).find("[name=map]").attr("data-key");
  app.actions.create({
    buttons: [{
        text: "Remove map from device?",
        color: "red",
        onClick: function() {
          app.functions.deleteMap(id);
        }
      }, {
        text: "Cancel",
        color: "blue"
      }
    ]
  }).open();
  return false;
});

$$(".ptr-content").on("ptr:refresh", function (e) {
  app.functions.loadAvailableMaps();
});

app.init();
