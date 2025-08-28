const viewport        = document.getElementById("viewport");
const speed_display   = document.getElementById("speedDisplay");
const alert_display   = document.getElementById("alertDisplay");
const unit_selector   = document.getElementById("unitSelect");
const r               = 6371000; // metres
const deg2rad         = Math.PI / 180; // pre-calculate
const units           = [3.6, 2.237, 1.0];
let unit              = 1;
/** @type {GeolocationCoordinates} */
let coords1           = null;
/** @type {GeolocationCoordinates} */
let coords2           = null;
let timestamp1        = 0;
let timestamp2        = 0;
let time              = 0;
let distance          = 0;
let speed             = 0;
let next_speed        = 0;
let timeout_id        = 0;

/**
 * 
 * @param {number} hue 0 - 360
 * @param {number} brightness 
 */
function set_atmosphere_colour(hue, brightness) {
  if (hue < 0) hue = 0;
  if (hue > 359) hue = 359;
  speed_display.style.textShadow    = `0 0 calc(${brightness} *  0.3rem) #fff,
                                       0 0 calc(${brightness} *  0.6rem) #fff,
                                       0 0 calc(${brightness} *    1rem) #fff,
                                       0 0 calc(${brightness} * 1.25rem)  hsl(${hue}, 100%, 50%),
                                       0 0 calc(${brightness} *  1.8rem)  hsl(${hue}, 100%, 50%),
                                       0 0 calc(${brightness} *  2.5rem)  hsl(${hue}, 100%, 50%),
                                       0 0 calc(${brightness} *  3.5rem)  hsl(${hue}, 100%, 50%),
                                       0 0 calc(${brightness} *  4.6rem)  hsl(${hue}, 100%, 50%);`;
  alert_display.style.textShadow    = `0 0 calc(${brightness} *  0.3rem) #fff,
                                       0 0 calc(${brightness} *  0.6rem) #fff,
                                       0 0 calc(${brightness} *    1rem) #fff,
                                       0 0 calc(${brightness} * 1.25rem)  hsl(${hue}, 100%, 50%),
                                       0 0 calc(${brightness} *  1.8rem)  hsl(${hue}, 100%, 50%),
                                       0 0 calc(${brightness} *  2.5rem)  hsl(${hue}, 100%, 50%),
                                       0 0 calc(${brightness} *  3.5rem)  hsl(${hue}, 100%, 50%),
                                       0 0 calc(${brightness} *  4.6rem)  hsl(${hue}, 100%, 50%);`;
  viewport.style.background        =  `radial-gradient(at top,
                                       hsl(${hue}, 100.00%, 50.00%) 0%,
                                     hsl(0, 0.00%, 0.00%)  80%);`
  
}

/**
 * 
 * @param {GeolocationPosition} position 
 */
function success(position) {
  coords1 = coords2 || position.coords;
  timestamp1 = timestamp2;
  coords2 = position.coords;
  timestamp2 = position.timestamp;
  calculate_speed();
  alert_display.innerHTML = "Live";
}

/**
 * 
 * @param {GeolocationPositionError} err Docs - https://developer.mozilla.org/en-US/docs/Web/API/GeolocationPositionError
 */
function failure(err) {
  speed_display.innerHTML = "---";
  alert_display.innerHTML = err.message;
  set_atmosphere_colour(0);
}

function lerp_to_next() {
  if (speed === next_speed) {
    clearTimeout(timeout_id);
    return;
  }

  if (next_speed >= speed) {
    speed++;
  } else {
    speed--;
  }

  speed_display.innerHTML = speed;
  timeout_id = setTimeout(lerp_to_next, 25);
}

function calculate_speed() {
  // coords[lat, long, timestamp]
  let latitude1  = coords1.latitude * deg2rad;
  let longitude1 = coords1.longitude * deg2rad;
  let latitude2  = coords2.latitude * deg2rad;
  let longitude2 = coords2.longitude * deg2rad;

  // p
  let rho1 = r * Math.cos(latitude1);
  let z1 = r * Math.sin(latitude1);
  let x1 = rho1 * Math.cos(longitude1);
  let y1 = rho1 * Math.sin(longitude1);

  // q
  let rho2 = r * Math.cos(latitude2);
  let z2 = r * Math.sin(latitude2);
  let x2 = rho2 * Math.cos(longitude2);
  let y2 = rho2 * Math.sin(longitude2);

  // dot product
  let dot = x1 * x2 + y1 * y2 + z1 * z2;
  let cos_theta = dot / (r ** 2);

  // clamp to prevent floating point errors
  if (cos_theta > 1) cos_theta = 1;
  if (cos_theta < 0) cos_theta = 0;

  // complete dot product
  let theta = Math.acos(cos_theta);
  
  // distance in metres and time in ms
  distance = r * theta;
  time = timestamp2 - timestamp1;

  // Speedometer in metres per second
  next_speed = Math.round((distance / (time / 1000)) * units[unit]);

  // lerp_to_next();
  speed_display.innerHTML = next_speed;
  set_atmosphere_colour(0, 2);
}

/**
 * 
 * @param {Event} e 
 */
function handle_unit_change(e) {
  unit = Number(e.currentTarget.value);
}

if (navigator.geolocation) {
  navigator.geolocation.watchPosition(success, failure, { enableHighAccuracy: true });
}

unit_selector.addEventListener("change", handle_unit_change);
