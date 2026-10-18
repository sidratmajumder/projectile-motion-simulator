
// Test to make sure JS is connected to the HTML
console.log("Javascript is successfully connected!");
console.log("Hello World");

// Prep the simulationCanvas
const canvas = document.getElementById("simulationCanvas");
const ctx = canvas.getContext("2d");
// Set relative Dimensions
canvas.width = window.innerWidth * 0.7;
canvas.height = window.innerHeight * 0.6;
ctx.font = "20px Times New Roman";
ctx.setLineDash([]);

// Prep the gridSimulationCanvas
const gridSimulation = document.getElementById("gridSimulationCanvas");
const gridSimulationCtx = gridSimulation.getContext("2d");
//set dimensions
gridSimulation.width = canvas.width;
gridSimulation.height = canvas.height;
gridSimulationCtx.font = "20px Times New Roman";


// prep velocity and acceleration canvases
const velocityCanvas = document.getElementById("velocityCanvas");
const velocityCtx = velocityCanvas.getContext("2d");
const accelerationCanvas = document.getElementById("accelerationCanvas");
const accelerationCtx = accelerationCanvas.getContext("2d");

const velocityCenterX = velocityCanvas.width / 2;
const velocityCenterY = velocityCanvas.height / 2;
velocityCtx.font = "9px Times New Roman";
const velocityGraphPoints = [];
let velocityTime = 0;
//dependent on initial conditions
let velocityTimeMax = 2; // sec
let velocityGraphMax = 10; // m/s

const graphMargin = {
    left: 25,
    right: 25,
    top: 28,
    bottom: 24
}



const accelerationCenterX = accelerationCanvas.width / 2;
const accelerationCenterY = accelerationCanvas.height / 2;
accelerationCtx.font = "20px Times New Roman";
let accelerationGraphMax = 12;
accelerationCtx.font = "9px Times New Roman";


// Preps an ID for the animations
let animationId;

// Put in the perspective of meters. We care more about width than height
const widthInMeters = 20;
// for height we will scale by the same factor as width
const scale = canvas.width / widthInMeters;
const heightInMeters = canvas.height / scale;
// so when we do our math -> d * scale = d * width / d = width


// Set up CAMERA
let cameraX = 0;
// 70% of the width is the maximum x the ball can go to before we begin sliding cam
const cameraFollowPoint = widthInMeters * 0.7;


// velocity buttons, input, and slider
const velocityInput = document.getElementById("velocity-input");
const velocitySlider = document.getElementById("velocity-slider");
const velocityMinMin = document.getElementById("velocity-minus10");
const velocityMin = document.getElementById("velocity-minus1");
const velocityPlus = document.getElementById("velocity-plus1");
const velocityPlusPlus = document.getElementById("velocity-plus10");

// angle input, slider
const angleInput = document.getElementById("angle-input");
const angleSVG = document.getElementById("angle-dial-svg");
const angleKnob = document.getElementById("angle-knob");
const CX = 10;
const CY = 90;
const angleRadius = 80;

let isDragging = false;

// initial platform inputs, sliders
const platformWidthInput = document.getElementById("platform-width-input");
const platformWidthSlider = document.getElementById("platform-width-slider")
const platformHeightInput = document.getElementById("platform-height-input");
const platformHeightSlider = document.getElementById("platform-height-slider");

// gravity inputs
const gravityDropdown = document.getElementById("gravity-dropdown");
const gravityDisplay = document.getElementById("gravity-display");
const gravityCustomInput = document.getElementById("gravity-custom-input");
gravityDropdown.disabled = false;
gravityCustomInput.disabled = false;
gravityCustomInput.hidden = true;

// is program running? I want it to be paused initially.
let isRunning = false;

// Set Gravity Presets
const gravityPresets =  {
    Mercury: 3.70,
    Venus: 8.87,
    Earth: 9.81,
    Mars: 3.71,
    Jupiter: 24.8,
    Saturn: 10.4,
    Uranus: 8.69,
    Neptune: 11.2,
    Pluto: 0.620,
    Custom: 9.81
};
// default gravity, can and will change with user interacton
let gravity = gravityPresets.Earth;
console.log(gravity);
// updateGravity(gravityPresets[gravityDropdown.value]);

//Define our "Objects"
const initialPlatform = {
    // Physics
    x: 0,
    y: heightInMeters - 1,
    w: 1.5,
    h: 1,

    // Design
    color: "#333c77 "
};
const ball = {
    // Physics, work as a point mass
    x: initialPlatform.w,
    y: initialPlatform.y,
    vx: 0,
    vy: 0,
    m: 5,
    // Design
    radius: 0.1,
    color: "#5479bd"
};

// make trajectory points
const trajectoryPoints = [];

// set initial conditions for Velocity
const velocity = {
    magnitude: 5,
    direction: 45
}



// Allow adjustments to velocity based on user input
function updateVelocityUI(newValue) {
    if (newValue < 0) {
        newValue = 0;
    }

    let newMax = 10;

    while (newMax < newValue) {
        newMax *= 10;
    }
    // Changes the max value of the slider to fit the user's scope
    velocitySlider.max = newMax;
    velocityInput.value = newValue;
    velocitySlider.value = newValue;
    //update magnitude
    velocity.magnitude = newValue;
    //recalculate components

    if (!isRunning) {
        ball.vx = velocity.magnitude * Math.cos(velocity.direction * Math.PI / 180);
        ball.vy = velocity.magnitude * Math.sin(velocity.direction * Math.PI / 180) * -1;
        velocityGraphPoints.length = 0;
        updateVelocityGraphLimits();
        renderScene();
    }
    
}

//The Number converts the value to numbers?
velocitySlider.addEventListener("input", () => {
    updateVelocityUI(Number(velocitySlider.value));
})
velocityInput.addEventListener("change", () => {
    updateVelocityUI(Number(velocityInput.value));
})
velocityMinMin.addEventListener("click", () => {
    updateVelocityUI(Number(velocityInput.value) - 10);
})
velocityMin.addEventListener("click", () => {
    updateVelocityUI(Number(velocityInput.value) - 1);
})
velocityPlus.addEventListener("click", () => {
    updateVelocityUI(Number(velocityInput.value) + 1);
})
velocityPlusPlus.addEventListener("click", () => {
    updateVelocityUI(Number(velocityInput.value) + 10);
})


// Angle Slider Stuff
angleKnob.addEventListener("mousedown", (event) => {
    event.preventDefault(); // prevent highlighting text

    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", stopDrag);

})

function handleDrag(event) {
    const rect = angleSVG.getBoundingClientRect(); // get size of our SVG
    console.log(rect);
    // scaling bc the svg has a 100x100 coord system we set up
    const scaleX = 100 / rect.width;
    const scaleY = 100 / rect.height;

    const mouseX = (event.clientX - rect.left) * scaleX;
    const mouseY = (event.clientY - rect.top) * scaleY;

    const dx = mouseX - CX;
    const dy = (mouseY - CY) * -1;

    let angleRadians = Math.atan2(dy, dx);
    let angleDegrees = angleRadians * 180 / Math.PI;

    updateAngle(Math.round(angleDegrees));

}

function stopDrag() {
    document.removeEventListener("mousemove", handleDrag);
    document.removeEventListener("mouseup", stopDrag);
}

// update velocity.angle, anchor it to the angleinput? because it changes with the slider too
function updateAngle(newAngle) {
    if (newAngle > 90) {
        newAngle = 90;
    } else if (newAngle < 0) {
        newAngle = 0;
    }

    velocity.direction = newAngle;
    angleInput.value = newAngle;

    const snappedRadians = newAngle * -1 * (Math.PI / 180);
    const angleKnobX = CX + angleRadius * Math.cos(snappedRadians);
    const angleKnobY = CY + angleRadius * Math.sin(snappedRadians);

    angleKnob.setAttribute("cx", angleKnobX);
    angleKnob.setAttribute("cy", angleKnobY);

    if (!isRunning) {
        ball.vx = velocity.magnitude * Math.cos(velocity.direction * Math.PI / 180);
        ball.vy = velocity.magnitude * Math.sin(velocity.direction * Math.PI / 180) * -1;
        velocityGraphPoints.length = 0;
        updateVelocityGraphLimits();
        updateAccelerationGraphLimits();
        renderScene();
    }
    
}

// set the initial knob position
updateAngle(velocity.direction);


angleInput.addEventListener("change", () => {
    updateAngle(Number(angleInput.value));
});


// adjust initital height and x
function updateInitialX(ballx) {
    if (ballx > 5) {
        ballx = 5;
    } else if (ballx < 0) {
        ballx = 0;
    }

    platformWidthSlider.value = ballx;
    platformWidthInput.value = ballx;

    if (!isRunning) {
        initialPlatform.w = ballx;
        ball.x = ballx;
        cameraX = 0;
        drawScene();
    }
}

function updateInitialY(bally) {
    if (bally > 20) {
        bally = 20;
    } else if (bally < 0) {
        bally = 0;
    }

    platformHeightInput.value = bally;
    platformHeightSlider.value = bally;

    if (!isRunning) {
        initialPlatform.y = heightInMeters - bally;
        initialPlatform.h = bally;
        ball.y = heightInMeters - bally;
        cameraX = 0;
        velocityGraphPoints.length = 0;
        updateVelocityGraphLimits();
        updateAccelerationGraphLimits();
        renderScene();
    }
}

platformWidthSlider.addEventListener("input", () => {
    updateInitialX(Number(platformWidthSlider.value));
})
platformWidthInput.addEventListener("change", () => {
    updateInitialX(Number(platformWidthInput.value));
})

platformHeightSlider.addEventListener("input", () => {
    updateInitialY(Number(platformHeightSlider.value));
})
platformHeightInput.addEventListener("change", () => {
    updateInitialY(Number(platformHeightInput.value));
})

function updateGravity(gravityInput) {
    // update text display
    gravityDisplay.textContent = String(gravityInput);

    if (!isRunning) {
        gravity = gravityInput;
        velocityGraphPoints.length = 0;
        updateVelocityGraphLimits();
        updateAccelerationGraphLimits();
        renderScene();
    }
}

gravityDropdown.addEventListener("change", () => {
    const planet = gravityDropdown.value;

    gravityDisplay.hidden = (planet === "Custom");
    gravityCustomInput.hidden = (planet !== "Custom");

    updateGravity(gravityPresets[planet]);
})

gravityCustomInput.addEventListener("change", () => {
    const rawValue = gravityCustomInput.value.trim();
    const newGravity = Number(rawValue);

    if (rawValue !== "" && (Number.isFinite(newGravity)) && newGravity > 0) {
        gravityPresets.Custom = newGravity;

    } else {
        gravityCustomInput.value = 9.81
        gravityPresets.Custom = 9.81
        
    }
    updateGravity(gravityPresets.Custom);
})

// handle world and camera conversions
// worldX is "the X of something in the world"
// essentially, "what it is in the world, to what it should be in the screen"
// initially cameraX is 0, so it stays what it is, but if we shift the bottom left, say begin at x=10, we return the difference between actual position and the reference
// allows for us to change where we SEE it
// may help teach diff between displacement vs position

// it handles meters to pixels scale also
function worldToScreenX(worldX) {
    return (worldX - cameraX) * scale;
}

function updateCamera() {
    const ballPositionOnScreen = ball.x - cameraX;
    // actual - reference
    if (ballPositionOnScreen > cameraFollowPoint) {
        cameraX = ball.x - cameraFollowPoint;
    }
}


// draw grid on the main projectile sim
function drawGridMain() {
    gridSimulationCtx.clearRect(0, 0, gridSimulation.width, gridSimulation.height);

    gridSimulationCtx.strokeStyle = "rgba(20, 18, 20, 0.55)";
    gridSimulationCtx.fillStyle = "rgba(234, 241, 241, 0.75)";
    gridSimulationCtx.lineWidth = 1;

    const gridSpacing = 1; //1 meter
    const gridSpacingBold = 5; //5 meters

    // draw vertical lines, x = 
    const firstVisibleX = Math.floor(cameraX);

    for (
        let worldX = firstVisibleX; 
        worldX <= widthInMeters + cameraX; 
        worldX += gridSpacing
    ) {
        const screenX = worldToScreenX(worldX);
        
        if ((worldX % gridSpacingBold) == 0) {
            gridSimulationCtx.strokeStyle = "rgba(234, 241, 241, 0.35)";
        } else {
            gridSimulationCtx.strokeStyle = "rgba(20, 18, 20, 0.55)";
        }

        gridSimulationCtx.beginPath()
        gridSimulationCtx.moveTo(screenX, 0);
        gridSimulationCtx.lineTo(screenX, gridSimulation.height);
        gridSimulationCtx.stroke();
        
        gridSimulationCtx.fillText(`${worldX} m`, screenX + 2, gridSimulation.height - 2);
    }

    // draw horizontal lines, y =
    // this is temporary, there is no change in cameray yet or even a camera y
    for (
        let y= 0; 
        y <= heightInMeters;
        y += gridSpacing
    ) {
        const screenY = gridSimulation.height - y * scale;

        if ((y % gridSpacingBold) == 0) {
            gridSimulationCtx.strokeStyle = "#141214";
        } else {
            gridSimulationCtx.strokeStyle = "#EAF1F1";
        }

        gridSimulationCtx.beginPath();
        gridSimulationCtx.moveTo(0, screenY);
        gridSimulationCtx.lineTo(gridSimulation.width, screenY);
        gridSimulationCtx.stroke();

        gridSimulationCtx.fillText(`${y} m`, 2, screenY - 2);
    }

}

// drawing the trajectory curve
function drawTrajectory() {
    ctx.setLineDash([])
    if (trajectoryPoints.length < 2) {
        return;
    }

    ctx.beginPath();

    ctx.moveTo(
        worldToScreenX(trajectoryPoints[0].x),
        trajectoryPoints[0].y * scale
    );

    for (
        let i = 1;
        i < trajectoryPoints.length;
        i++
    ) {
        ctx.lineTo(
            worldToScreenX(trajectoryPoints[i].x),
            trajectoryPoints[i].y * scale
        );
    }

    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.closePath();
}




// temporary stop button
const stopButton = document.getElementById("stop-btn");
stopButton.addEventListener("click", () =>{
    cancelAnimationFrame(animationId);
    console.log("Animation Stopped");
    isRunning = false;
    gravityDropdown.disabled = false;
    gravityCustomInput.disabled = false;
} );
// temp start
const startButton = document.getElementById("start-btn");
startButton.addEventListener("click", () => {
    if (!isRunning) {
        cameraX = 0;
        trajectoryPoints.length = 0;

        // reset ball position
        ball.x = initialPlatform.w;
        ball.y = initialPlatform.y;

        trajectoryPoints.push({
            x:ball.x,
            y:ball.y
        });

        // reset ball velocity?
        updateVelocityUI(Number(velocityInput.value));
        // set angle
        updateAngle(Number(angleInput.value));
        // set position
        updateInitialX(Number(platformWidthInput.value));
        updateInitialY(Number(platformHeightInput.value));

        // set gravity
        const planet = gravityDropdown.value;
        if (planet === "Custom") {
            const rawValue = gravityCustomInput.value.trim();
            const newGravity = Number(rawValue);

            if (rawValue !== "" && Number.isFinite(newGravity) && newGravity >= 0) {
                gravityPresets.Custom = newGravity;
            } else {
                gravityPresets.Custom = 9.81;
                gravityCustomInput.value = 9.81;
            }

            updateGravity(gravityPresets.Custom);
        } else {
            updateGravity(gravityPresets[planet]);
        }
    
        gravityDropdown.disabled = true;
        gravityCustomInput.disabled = true;

        velocityTime = 0;
        velocityGraphPoints.length = 0;
        velocityGraphPoints.push({
            t:0,
            vy: -1 * ball.vy
        })

        // fix bad gravity
       

        console.log("You started the animation");
        isRunning = true;
        lastTime = 0;
        animationId = requestAnimationFrame(animate);
    } else {
        console.log("Animation is already running!");
    }
})

// reset position button
const resetPositionButton = document.getElementById("reset-pos-btn");

resetPositionButton.addEventListener("click", () => {
    cancelAnimationFrame(animationId);
    console.log("Resetting...");
    isRunning = false;
    cameraX = 0;
    trajectoryPoints.length = 0;
    velocityGraphPoints.length = 0;
    velocityTime = 0;
    gravityDropdown.disabled = false;
    gravityCustomInput.disabled = false;

    // reset ball velocity?
    updateVelocityUI(Number(velocityInput.value));
    // set angle
    updateAngle(Number(angleInput.value));
    // set position
    updateInitialX(Number(platformWidthInput.value));
    updateInitialY(Number(platformHeightInput.value));

    //might have to put more here if I make the screen move
    renderScene();
    
    console.log("Position reset");
})






// get initial components
ball.vx = velocity.magnitude * Math.cos(velocity.direction * Math.PI / 180);
ball.vy = velocity.magnitude * Math.sin(velocity.direction * Math.PI / 180) * -1;


// drawing velocity vector and components
function drawVelocity() {
    ctx.setLineDash([])
    const vectorScale = 0.3; // 0.3s

    // start with whole velocity
    ctx.beginPath();
    
    const endX = ball.x + ball.vx * vectorScale;
    const endY = ball.y + ball.vy * vectorScale;
    const angle = Math.atan2(ball.vy, ball.vx);
    const yAngle = Math.atan2(ball.vy, 0);
    const bend = Math.PI / 6;
    ctx.moveTo(
        worldToScreenX(ball.x),
        ball.y * scale
    )
    ctx.lineTo(
        worldToScreenX(endX),
        endY * scale
    )
    ctx.strokeStyle = "#9B04CB";
    ctx.lineWidth = 2;
    ctx.stroke();

    // arrowhead for whole magnitude
    const arrowHeadLength = 10;
    ctx.moveTo(worldToScreenX(endX), endY * scale);
    ctx.lineTo(
        worldToScreenX(endX) - arrowHeadLength * Math.cos(angle - bend),
        endY * scale - arrowHeadLength * Math.sin(angle - bend)
    )

    ctx.moveTo(worldToScreenX(endX), endY * scale);
    ctx.lineTo(
        worldToScreenX(endX) - arrowHeadLength * Math.cos(angle + bend),
        endY * scale - arrowHeadLength * Math.sin(angle + bend)
    )

    ctx.strokeStyle = "#9B04CB";
    ctx.lineWidth = 2;
    ctx.stroke();

    //label
    ctx.fillStyle = "#9B04CB";
    ctx.fillText(
        Math.sqrt((ball.vx ** 2) + (ball.vy ** 2)).toFixed(1),
        worldToScreenX(ball.x + ball.vx * vectorScale * 0.5) - 10,
        scale * (ball.y + ball.vy * vectorScale * 0.5) - 10
    )
    ctx.closePath();

    // x component
    ctx.beginPath();
    ctx.setLineDash([5,2])
    ctx.moveTo(
        worldToScreenX(ball.x),
        ball.y * scale
    )
    ctx.lineTo(
        worldToScreenX(endX),
        ball.y * scale
    )
    ctx.strokeStyle = "#DD025E";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.moveTo(worldToScreenX(endX), ball.y * scale);
    ctx.lineTo(
        worldToScreenX(endX) - arrowHeadLength * Math.cos(-1 * bend),
        ball.y * scale - arrowHeadLength * Math.sin(-1 * bend)
    )

    ctx.moveTo(worldToScreenX(endX), ball.y * scale);
    ctx.lineTo(
        worldToScreenX(endX) - arrowHeadLength * Math.cos(bend),
        ball.y * scale - arrowHeadLength * Math.sin(bend)
    )
    ctx.strokeStyle = "#DD025E";
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // label
    ctx.fillStyle = "#DD025E";
    if (ball.vx > 1) {
        ctx.fillText(
            ball.vx.toFixed(1),
            worldToScreenX(ball.x + ball.vx * vectorScale * 0.5),
            scale * ball.y - 10
        )
    }
    ctx.closePath();

    // y component
    ctx.beginPath();
    ctx.setLineDash([5,2])
    ctx.moveTo(
        worldToScreenX(ball.x),
        ball.y * scale
    );
    ctx.lineTo(
        worldToScreenX(ball.x),
        endY * scale
    );
    ctx.strokeStyle = "#19F5F5";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.moveTo(worldToScreenX(ball.x), endY * scale);
    ctx.lineTo(
        worldToScreenX(ball.x) - arrowHeadLength * Math.cos(yAngle - bend),
        endY * scale - arrowHeadLength * Math.sin(yAngle - bend)
    );

    ctx.moveTo(worldToScreenX(ball.x), endY * scale);
    ctx.lineTo(
        worldToScreenX(ball.x) - arrowHeadLength * Math.cos(yAngle + bend),
        endY * scale - arrowHeadLength * Math.sin(yAngle + bend)
    );
    ctx.strokeStyle = "#19F5F5";
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // label
    ctx.fillStyle = "#19F5F5";
    if (Math.abs(ball.vy) > 1) {
        ctx.fillText(
            Math.abs(ball.vy).toFixed(1),
            worldToScreenX(ball.x) + 10,
            scale * (0.5 * ball.y + 0.5 * endY)
        )
    }
    ctx.closePath();
    ctx.setLineDash([])
    

}

// going to prob delete and redo this to be vy vs t
function drawVelocityGraph() {
    velocityCtx.setLineDash([])
    velocityCtx.clearRect(0,0,velocityCanvas.width,velocityCanvas.height);
    const left = graphMargin.left;
    const right = velocityCanvas.width - graphMargin.right;
    const top = graphMargin.top;
    const bottom = velocityCanvas.height - graphMargin.bottom;
    const zeroY = vyToGraphY(0);
    velocityCtx.save();
    //axes
    velocityCtx.beginPath();
    velocityCtx.moveTo(left,top);
    velocityCtx.lineTo(left,bottom);
    
    velocityCtx.moveTo(left,zeroY);
    velocityCtx.lineTo(right,zeroY);
    velocityCtx.strokeStyle = "#222933";
    velocityCtx.lineWidth = 1;
    velocityCtx.stroke();
    // axis labels
    velocityCtx.fillStyle = "#222933";
    velocityCtx.fillText("vy (m/s)", left - 15, top - 15);
    velocityCtx.fillText("t (s)",right + 6, zeroY + 2);

    // tick marks
    const yTickCount = 4;
    for (let i=0; i<=yTickCount;i++) {
        const vy = velocityGraphMax - i * (2 * velocityGraphMax / yTickCount);
        const y = vyToGraphY(vy);
        velocityCtx.beginPath();
        velocityCtx.moveTo(left-5,y);
        velocityCtx.lineTo(left,y);
        velocityCtx.strokeStyle = "#222933";
        velocityCtx.stroke();
        //label
        velocityCtx.fillStyle = "#222933";
        velocityCtx.textAlign = "right";
        velocityCtx.textBaseline = "middle";
        velocityCtx.fillText(vy.toFixed(1), left - 8, y);
    }
    const xTickCount = 8;
    for (let i=0; i<=xTickCount;i++) {
        const t = i * velocityTimeMax / xTickCount;
        const x = timeToGraphX(t);
        velocityCtx.beginPath();
        velocityCtx.moveTo(x, zeroY - 4);
        velocityCtx.lineTo(x,zeroY + 4);
        velocityCtx.strokeStyle = "#222933";
        velocityCtx.stroke();
        // label
        velocityCtx.fillStyle = "#222933";
        velocityCtx.textAlign = "center";
        velocityCtx.textBaseline = "top";
        velocityCtx.fillText(t.toFixed(1), x, bottom + 7);
    }
    // plotting
    if (velocityGraphPoints.length >= 2) {
        velocityCtx.beginPath();
        velocityCtx.moveTo(timeToGraphX(velocityGraphPoints[0].t),vyToGraphY(velocityGraphPoints[0].vy));

        for(let i = 1; i< velocityGraphPoints.length;i++) {
            velocityCtx.lineTo(timeToGraphX(velocityGraphPoints[i].t),vyToGraphY(velocityGraphPoints[i].vy));
        }
        velocityCtx.strokeStyle = "#19F5F5";
        velocityCtx.lineWidth = 2;
        velocityCtx.stroke();
    }
    velocityCtx.restore();
}

function velocityWidth() {
    return velocityCanvas.width - graphMargin.left - graphMargin.right;
}
function velocityHeight() {
    return velocityCanvas.height - graphMargin.top - graphMargin.bottom;
}
function timeToGraphX(t) {
    return graphMargin.left + (t / velocityTimeMax) * velocityWidth();
}
function vyToGraphY(vy) {
    return graphMargin.top + ((velocityGraphMax - vy) / (2 * velocityGraphMax)) * velocityHeight();
}
function updateVelocityGraphLimits() {
    const vyi = -ball.vy;
    const initialHeight = heightInMeters - ball.y;
    const flightTime =
        (
            vyi + Math.sqrt(vyi ** 2 + 2 * gravity * initialHeight)
        ) / gravity;
    velocityTimeMax = Math.max(1,Math.ceil(flightTime * 1.1));

    const vyf = vyi - gravity * flightTime;
    velocityGraphMax = Math.max(5, Math.ceil(Math.max(Math.abs(vyi),Math.abs(vyf)) * 1.1));
}

function drawAccelerationGraph() {
    accelerationCtx.setLineDash([]);
    accelerationCtx.clearRect(0,0,accelerationCanvas.width,accelerationCanvas.height);
    const left = graphMargin.left;
    const right = accelerationCanvas.width - graphMargin.right;
    const top = graphMargin.top;
    const bottom = accelerationCanvas.height - graphMargin.bottom;
    const zeroY = aToGraphY(0);
    accelerationCtx.save();
    //axes
    accelerationCtx.beginPath();

    accelerationCtx.moveTo(left,top);
    accelerationCtx.lineTo(left,bottom);

    accelerationCtx.moveTo(left,zeroY);
    accelerationCtx.lineTo(right,zeroY);

    accelerationCtx.strokeStyle = "#222933";
    accelerationCtx.lineWidth = 1;
    accelerationCtx.stroke();
    //labels
    accelerationCtx.fillStyle = "#222933";
    accelerationCtx.fillText("a (m/s\u00B2)",left - 15,bottom + 15);
    accelerationCtx.fillText("t (s)",right + 7, zeroY + 5);
    //tick marks
    const yTickCount = 4;
    for (let i=0;i<=yTickCount;i++) {
        const a = -1 * i * (accelerationGraphMax / yTickCount);
        const y = aToGraphY(a);
        accelerationCtx.beginPath();
        accelerationCtx.moveTo(left - 5, y);
        accelerationCtx.lineTo(left,y);
        accelerationCtx.strokeStyle = "#222933";
        accelerationCtx.stroke();
        accelerationCtx.fillStyle = "#222933";
        accelerationCtx.textAlign = "right";
        accelerationCtx.textBaseline = "middle";
        // label
        accelerationCtx.fillText(a.toFixed(1), left - 8, y);
    }
    const xTickCount = 8;
    for (let i=0; i<=xTickCount;i++) {
        const t = i * velocityTimeMax / xTickCount;
        const x = timeToGraphXAcceleration(t);
        accelerationCtx.beginPath();
        accelerationCtx.moveTo(x, zeroY);
        accelerationCtx.lineTo(x,zeroY + 4);
        accelerationCtx.strokeStyle = "#222933";
        accelerationCtx.stroke();
        // label
        accelerationCtx.fillStyle = "#222933";
        accelerationCtx.textAlign = "center";
        accelerationCtx.textBaseline = "top";
        accelerationCtx.fillText(t.toFixed(1), x, zeroY - 13);
    }
    //plotting
    const ay = -1 * gravity;
    const currentGraphTime = velocityTime;
    accelerationCtx.beginPath();
    accelerationCtx.moveTo(timeToGraphXAcceleration(0), aToGraphY(ay));
    accelerationCtx.lineTo(timeToGraphXAcceleration(currentGraphTime),aToGraphY(ay));
    accelerationCtx.strokeStyle = "#19F5F5";
    accelerationCtx.lineWidth = 2;
    accelerationCtx.stroke();

    accelerationCtx.restore();
    
}
function accelerationWidth() {
    return accelerationCanvas.width - graphMargin.left - graphMargin.right;
}
function accelerationHeight() {
    return accelerationCanvas.height - graphMargin.top - graphMargin.bottom;
}
function timeToGraphXAcceleration(t) {
    return graphMargin.left + (t / velocityTimeMax) * accelerationWidth();
}
function aToGraphY(a) {
    return graphMargin.top + (-1 * a / accelerationGraphMax) * accelerationHeight();
}
function updateAccelerationGraphLimits() {
    accelerationGraphMax = Math.max(5,Math.ceil(gravity * 1.2));
}

// gives us initial time for finding dt
let lastTime = 0;


// Collisions with bottom?

function didBallHitFloor() {
    return (ball.y >= heightInMeters);
};

function renderScene() {
    drawGridMain();
    drawScene();
    drawVelocityGraph();
    drawAccelerationGraph();
}
;

// make the animation
function animate(currentTime) {
    // Calculate Delta Time (dt)
    if (lastTime === 0) {
        // begins animating from the function being called
        lastTime = currentTime;
        animationId = requestAnimationFrame(animate);
        return;
    }
    const deltaTime = currentTime - lastTime;
    const dt = deltaTime / 1000 // convert from ms to s
    lastTime = currentTime // for next frame
    velocityTime += dt;
    

    // update values
    ball.vy = ball.vy + (gravity * dt);
    
    ball.x = ball.x + ball.vx * dt;
    ball.y = ball.y + ball.vy * dt;

    trajectoryPoints.push({
            x:ball.x,
            y:ball.y
    });
    
    velocityGraphPoints.push({
        t: velocityTime,
        vy: -1 * ball.vy
    })

    updateCamera(); //because now x has changed
    renderScene();

    // break out if the ball hit the floor
    if (didBallHitFloor() == true) {
        // clamp ball to floor
        ball.y = heightInMeters;


        trajectoryPoints[trajectoryPoints.length - 1] = {
            x: ball.x,
            y: ball.y
        };



        drawScene();

        cancelAnimationFrame(animationId);
        
        isRunning = false;
        console.log("Ball has hit the floor"); 

        // reallow adjusting
        gravityDropdown.disabled = false;
        gravityCustomInput.disabled = false;
        return;
    }

    animationId = requestAnimationFrame(animate);
}


function drawScene() {
    ctx.clearRect(0,0,canvas.width, canvas.height);

    // initial platform
    ctx.fillStyle = initialPlatform.color;
    ctx.fillRect(
        worldToScreenX(initialPlatform.x),
        initialPlatform.y * scale,
        initialPlatform.w * scale,
        initialPlatform.h * scale
    );


    drawTrajectory();
    drawVelocity();


    // ball
    ctx.beginPath();
    
    ctx.arc(
        worldToScreenX(ball.x), // show the displacement from reference x
        ball.y * scale,
        ball.radius * scale,
        0,
        Math.PI * 2
    );
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();
}

renderScene();