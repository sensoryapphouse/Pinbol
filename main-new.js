// Settings:
// speed of scan 1-5
// activate on switch down or switch up
var panel;
var panelvisible = false;
var settings;
var splash;
var speed;
var s1;
var s2;
var mute;

var activateOnSwitchDown = false;
var that;
var snd1, snd2, snd3;
var increment = 1;

window.onload = () => {
    'use strict';
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js');
    }
    panel = document.querySelector('panel');
    settings = document.querySelector('settings');
    splash = document.querySelector('splash');
    setUpPanel();
    var game = new Phaser.Game(500, 860, Phaser.AUTO, '');
    game.state.add("main", GameState, true);
    splash.onclick = function () {
        splash.hidden = true;
    }
}

function setUpPanel() {
    panel.style.left = "130vw";
    slideTo(panel, 130);
    mute = document.createElement("INPUT");
    mute.style.position = "absolute";
    mute.style.height = "3vh";
    mute.style.width = "3vw";
    mute.style.left = "17vw";
    mute.style.top = "4vh";
    mute.checked = false;
    mute.setAttribute("type", "checkbox");
    mute.checked = false;
    speed = document.createElement("INPUT");
    speed.setAttribute("type", "range");
    speed.style.position = "absolute";
    speed.style.height = "2vh";
    speed.style.width = "15vw";
    speed.style.left = "4.3vw";
    speed.style.top = "13vh";
    speed.style.color = 'green';
    speed.value = 3;
    speed.min = 1;
    speed.max = 5;

    s1 = document.createElement("INPUT");
    s1.style.position = "absolute";
    s1.style.height = "3vh";
    s1.style.width = "3vw";
    s1.style.left = "14vw";
    s1.style.top = "22.5vh";
    s2 = document.createElement("INPUT");
    s2.style.position = "absolute";
    s2.style.height = "3vh";
    s2.style.width = "3vw";
    s2.style.left = "6.5vw";
    s2.style.top = "22.5vh";
    s1.setAttribute("type", "radio");
    s2.setAttribute("type", "radio");

    s2.checked = true;

    function switchOption(i) {
        switch (i) {
            case 1:
                s1.checked = true;
                s2.checked = false;
                localStorage.setItem("Shoot.onUp", 1);
                break;
            case 2:
                s2.checked = true;
                s1.checked = false;
                localStorage.setItem("Shoot.onUp", 0);
                break;
        }
    }

    s1.onclick = function (e) {
        switchOption(1);
    }
    s2.onclick = function (e) {
        switchOption(2);
    }

    panel.appendChild(mute);
    panel.appendChild(speed);
    panel.appendChild(s1);
    panel.appendChild(s2);

    settings.style.left = "92vw";
    // Retrieve settings
    var s = localStorage.getItem("Shoot.mute");
    mute.checked = (s == "true");
    s = parseInt(localStorage.getItem("Shoot.speed"));
    if (s < 1 || s > 5)
        s = 3;
    speed.value = s.toString();
    increment = .2 + (speed.value / 3);
    s = localStorage.getItem("Shoot.onUp");
    if (s == 1)
        switchOption(1);
    else
        switchOption(2);

    mute.onclick = function (e) {
        localStorage.setItem("Shoot.mute", mute.checked);
    }
    speed.onclick = function (e) {
        localStorage.setItem("Shoot.speed", speed.value);
        increment = .2 + (speed.value / 4);
    }

    panel.onmousedown = function (e) { // speed, paddle size, ball size
        e.stopPropagation();
    }

    settings.onmousedown = function (e) { // speed, paddle size, ball size
        e.stopPropagation();
        if (panelvisible) { // save stored values
            slideTo(panel, 130);
            slideTo(settings, 92);
        } else {
            slideTo(panel, 75);
            slideTo(settings, 78);
        }
        panelvisible = !panelvisible;
    }

    function slideTo(el, left) {
        var steps = 5;
        var timer = 50;
        var elLeft = parseInt(el.style.left) || 0;
        var diff = left - elLeft;
        var stepSize = diff / steps;
        console.log(stepSize, ", ", steps);

        function step() {
            elLeft += stepSize;
            el.style.left = elLeft + "vw";
            if (--steps) {
                setTimeout(step, timer);
            }
        }
        step();
    }
}


var GameState = function (game) {
    var _over = false;
    var _holding = false;
    var _going = false;
    var _pointID = -1;
    var _ballNum = 3;
    var _ballKill = 0;
    var _xrow;
    var _score;
    var _level;

    var balls, shapes, line, tweenText;
    var ballMaterial, worldMaterial;

    var linestep = 0.01;
    that = this;

    this.init = function () {
        game.stage.backgroundColor = "#112233";
        _over = false;
        _holding = false;
        _going = false;
        _pointID = -1;
        _ballNum = 3;
        _ballKill = 0;
        _xrow = 0;
        _score = 0;
        _level = 0;
        hotKeys = null;
    };

    function PlaySnd(id) {
        if (mute.checked)
            return;
        switch (id) {
            case 1:
                snd1.play();
                break;
            case 2:
                snd2.play();
                break;
            default:
                snd3.play();
                break;
        }
    }

    this.preload = function () {
        if (!game.device.desktop) {
            this.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;
            this.load.spritesheet("ball", "images/balls.png", 32, 32);
            this.load.spritesheet("ball2", "images/balls2.png", 48, 48);
        } else {
            //this.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT; //SHOW_ALL;
            this.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;
            this.load.spritesheet("ball", "images/ballsT.png", 24, 48);
            this.load.spritesheet("ball2", "images/balls2T.png", 48, 64);
        }
        this.load.image("ground", "images/ground.png");
        this.load.image("dot", "images/dot.png");
        this.load.spritesheet("button", "images/buttons.png", 80, 40);
        this.load.audio("snd1", "sounds/1.mp3");
        this.load.audio("snd2", "sounds/2.mp3");
        this.load.audio("snd3", "sounds/3.mp3");
    };

    this.create = function () {
        snd1 = game.add.audio('snd1');
        snd2 = game.add.audio('snd2');
        snd3 = game.add.audio('snd3');
        //snd1.play();
        game.physics.startSystem(Phaser.Physics.P2JS);
        game.physics.p2.gravity.y = 1000; // 250, 500,  1000

        ballMaterial = game.physics.p2.createMaterial('ballMaterial');
        worldMaterial = game.physics.p2.createMaterial('worldMaterial');
        game.physics.p2.createContactMaterial(ballMaterial, worldMaterial, {
            restitution: 0.98, // .98
            friction: 0
        });
        game.physics.p2.createContactMaterial(ballMaterial, ballMaterial, {
            restitution: 0,
            friction: 0,
            stiffness: 0.00001
        });
        game.physics.p2.setWorldMaterial(worldMaterial);

        game.add.tileSprite(0, 0, game.width, 60, "ground").alpha = 0.;

        var home = game.add.sprite(game.world.centerX, 30, "ball", 3);
        home.anchor.setTo(0.5);
        home.scale.setTo(1.2);
        home.update = function () {
            this.alpha = (!_over && !_going) ? 1 : 0.5;
        };

        var f = (window.innerHeight / 30);
        var scoreText = game.add.text(10, 30, "#" + _score + "", {
            fontSize: "25px",
            fill: "#fff"
        });
        scoreText.anchor.setTo(0, 0.5);
        scoreText.update = function () {
            this.text = "#" + _score + "";
        };

        var levelText = game.add.text(game.width - 10, 100, "⊛" + _ballNum + "", {
            fontSize: "25px",
            fill: "#fff"
        });
        levelText.anchor.setTo(1, 0.5);
        levelText.update = function () {
            this.text = "⊛" + _ballNum;
        };

        shapes = game.add.physicsGroup(Phaser.Physics.P2JS);
        balls = game.add.physicsGroup(Phaser.Physics.P2JS);

        var ground = game.add.tileSprite(game.world.centerX, game.height - 15, game.width, 30, "ground");
        game.physics.p2.enable(ground);
        ground.body.static = true;
        ground.body.onBeginContact.add(function (b1, b2) {
            if (b1 && b1.sprite.key == "ball") {
                b1.sprite.kill();
                _ballKill++;
                if (_ballKill == _ballNum) {
                    this._shapesUp();
                }
            }
        }, this);

        tweenText = game.add.text(0, 0, "", {
            fontSize: "36px",
            fill: "#fff"
        });
        tweenText.anchor.setTo(0.5);
        tweenText.alpha = 0;

        line = game.add.tileSprite(game.world.centerX, 30, game.world.centerX, 16, "dot");
        line.anchor.setTo(0, 0.5);
        line.visible = false;

        // Create shapes
        for (var i = 2; i < 5; i++) {
            this._createShapes(i);
        }

        function down() {
            if (_over) {
                game.state.start("main");
            }
            if (!_over && !_going && !_holding) {
                _holding = true;
                line.visible = true;
            }
        }

        function up() {
            if (_holding) { // && p.id == _pointID) {
                _holding = false;
                _pointID = -1;
                _going = true;
                line.visible = false;
                // Create Balls
                var vPoint = that._velocityFromRotation(line.rotation, 800); // PB 400, 600, 800
                for (var i = 0; i < _ballNum; i++) {
                    game.time.events.add(300 * i, function (id, p) { // PB 200
                        if (id < balls.children.length) {
                            var ball = balls.getChildAt(id);
                            ball.reset(game.world.centerX, 30);
                        } else {
                            var ball = balls.create(game.world.centerX, 30, "ball", 0);
                            ball.anchor.set(0.5);
                            ball.scale.set(0.7);
                            ball.body.setCircle(12);
                            ball.body.setMaterial(ballMaterial);
                            ball.body.onBeginContact.add(function (b1, b2) {
                                if (this.body.data.gravityScale == 0) {
                                    if (b1 && b1.sprite.key == "ball") {
                                        return;
                                    }
                                    this.body.data.gravityScale = 1;
                                }
                            }, ball);
                        }
                        ball.body.data.gravityScale = 0;
                        ball.body.velocity.x = p.x; // PB / speed
                        ball.body.velocity.y = p.y;
                    }, this, i, vPoint);
                }
                _ballKill = 0;
            }
        }

        function switchDown() {
            if (!splash.hidden) {
                if (s2.checked)
                    splash.hidden = true;
                return;
            }
            if (s2.checked) {
                down();
                up();
            }
        }

        function switchUp() {
            if (!splash.hidden) {
                if (s1.checked) splash.hidden = true;
                return;
            }
            if (s1.checked) {
                down();
                up();
            }
        }

        game.input.keyboard.onDownCallback = function (e) {
            if (e.repeat)
                return;
            switchDown();
        };
        game.input.keyboard.onUpCallback = function (e) {
            switchUp();
        };
        game.input.onDown.add(function (p) {
            switchDown();
        }, this);
        game.input.onUp.add(function (p) {
            switchUp();
        }, this);

        game.input.gamepad.start();
        game.input.gamepad.onDownCallback = function (e) {
            switchDown();
        };
        game.input.gamepad.onUpCallback = function (e) {

            switchUp();
        };
    };

    this.update = function () {
        //        if (!_going && _holding) {
        //            var p = _pointID == 0 ? game.input.Pointer: game.input.pointers[_pointID - 1];
        //            line.rotation = Math.atan2(p.y - 20, p.x - 225);
        //        }
        if (!_going && !_over) { // PB make line visible at right times
            line.visible = true;
        } else
            line.visible = false;
        //        _holding = true;//        line.visible = true;
        line.rotation += linestep * increment;
        //        console.log(line.rotation);
        if (line.rotation <= 0) {
            linestep = -linestep;
            line.rotation = linestep * increment;
        } else if (line.rotation >= Math.PI) {
            linestep = -linestep;
            line.rotation = Math.PI + linestep;
        }
    };

    this._shapesUp = function () {
        this._createShapes(5);
        shapes.forEachAlive(function (shape) {
            var topY = shape.body.y - 90;
            if (topY < 60 && !_over) {
                _over = true;
                this._overMenu();
            }
            game.add.tween(shape.body).to({
                y: topY
            }, 200, "Linear", true);
        }, this);
        _going = false;
    };

    this._createShapes = function (i) {
        if (_xrow == 0) {
            this._levelUp();
        }
        var col = 5 - (_xrow % 2);
        for (var j = 0; j < col; j++) {
            var shapeID = game.rnd.between(1, 3);
            var angle;
            if (!game.device.desktop) {
                angle = game.rnd.between(0, 11) * 30
            } else {
                angle = game.rnd.between(0, 11) * 2;
            }
            var shape = shapes.getFirstDead(true, 65 + j * 90 + 45 * (_xrow % 2), 410 + i * 90, "ball2", shapeID);
            shape.anchor.set(0.5);
            if (shapeID == 1) {
                shape.body.setRectangle(44, 2 * 44, 0, 0);
                shape.body.ID = 1;
            } else if (shapeID == 3) {
                shape.body.addPolygon(null, [23, 0, 0, 39, 1, 40, 46, 40, 47, 39, 24, 0]);
                shape.body.ID = 2;
            } else {
                shape.body.setCircle(22);
                shape.body.ID = 3;
                angle = 0;
            }
            shape.body.static = true;
            shape.body.setMaterial(worldMaterial);
            shape.health = game.rnd.between(_ballNum, _ballNum * 4); // 生命值为球数量的1~4倍
            if (!shape.txt) {
                shape.txt = shape.addChild(game.make.text(0, 0, shape.health + "", {
                    fontSize: "20px",
                    fill: "#f00"
                }));
                shape.txt.anchor.set(0.5);
                shape.update = function () {
                    this.txt.text = this.health;
                };
                shape.body.onEndContact.add(function (b1, b2) {
                    this.damage(1);
                    PlaySnd(this.body.ID);
                    _score++;
                }, shape);
            }
            shape.body.angle = angle;
            shape.txt.angle = -angle;
        }
        _xrow = (_xrow + 1) % 10;
    };

    this._velocityFromRotation = function (rotation, speed) {
        return new Phaser.Point((Math.cos(rotation) * speed), (Math.sin(rotation) * speed));
    };

    this._levelUp = function () {
        _level++;
        _ballNum = _level + 2;
        tweenText.x = this.world.centerX;
        tweenText.y = this.world.centerY;
        tweenText.alpha = 0;
        tweenText.setText("Level - " + _level);
        game.add.tween(tweenText)
            .to({
                y: tweenText.y - 100,
                alpha: 0.8
            }, 300, "Linear", false)
            .to({
                y: tweenText.y - 150
            }, 500, "Linear", false)
            .to({
                y: tweenText.y - 250,
                alpha: 0
            }, 300, "Linear", true);
    };

    this._overMenu = function () {
        var box = game.add.sprite(game.world.centerX, game.world.centerY, "button", 3);
        box.anchor.set(0.5);
        box.alpha = 0.8;
        box.scale.set(game.width / 80, 5);

        game.add.text(game.world.centerX, game.world.centerY - 40, "Game Over", {
            fontSize: "36px",
            fill: "#fff"
        }).anchor.set(0.5);

        var btn1 = game.add.sprite(game.world.centerX, game.world.centerY + 40, "button", 1);
        btn1.anchor.set(0.5);
        btn1.inputEnabled = true;
        btn1.events.onInputDown.add(function () {
            game.state.start("main");
        }, this);
    };
};
