var game = new Phaser.Game(960, 640, Phaser.CANVAS, 'smoking-carrots', 
	{ preload: preload, create: create, update: update, render: render});

var bullets;
var fireButton;
var bulletTime = 0;
var hero;
var cursor;
var enemies;
var score = 0;
var numberOfLives = 3;
var lives = numberOfLives;
var scoreString = '';
var scoreText;
var stateText;
var livesText;

function preload() {
	var IMAGEPATH = 'images/';
	game.load.image('background', IMAGEPATH + 'bg.jpg');
	game.load.image('hero', IMAGEPATH + 'hero.png');
	game.load.image('bullet', IMAGEPATH + 'bullet.png');
	game.load.spritesheet('evilBunny', IMAGEPATH + 'sprites/zombie-bunnies.png', 62, 62, 10);

	//gamepad buttons
	game.load.image('buttonvertical', IMAGEPATH + 'buttons/button-vertical.png');
	game.load.image('buttonhorizontal', IMAGEPATH + 'buttons/button-horizontal.png');
	game.load.image('buttonfire', IMAGEPATH + 'buttons/button-round-a.png');
	game.load.image('buttonsuper', IMAGEPATH + 'buttons/button-round-b.png');

	//Full Screen
	game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
	game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;
}

function create() {
	game.physics.startSystem(Phaser.Physics.ARCADE);

	game.world.setBounds(0, 0, 800, 600);
	game.add.sprite(0,0,'background');

	//  The score
	scoreString = 'Score : ';
	scoreText = game.add.text(10, 10, scoreString + score, { font: '34px Helvetica', fill: '#fff' });

	//The hero
	hero = game.add.sprite(480, 320, 'hero');
	hero.enableBody = true;
	game.physics.enable(hero, Phaser.Physics.ARCADE);

	hero.anchor.setTo(0.5, 0.5);

	//Bullet group
	bullets = game.add.group();
	bullets.enableBody = true;
	bullets.physicsBodyType = Phaser.Physics.ARCADE;
	bullets.createMultiple(30, 'bullet');
	bullets.setAll('anchor.x', -2);
	bullets.setAll('anchor.y', -2);
	bullets.setAll('outOfBoundsKill', true);
	bullets.setAll('checkWorldBounds', true);

	//evilBunny = game.add.sprite(300, 200, 'evilBunny');
    //  Here we add a new animation called 'walk'
    //  Because we didn't give any other parameters it's going to make an animation from all available frames in the 'mummy' sprite sheet
    //evilBunny.animations.add('walk');

    //  And this starts the animation playing by using its key ("walk")
    //  30 is the frame rate (30fps)
    //  true means it will loop when it finishes
    //evilBunny.animations.play('walk', 15, true);


    //Bad Guys group
    enemies = game.add.group();
    enemies.enableBody = true;
    enemies.physicsBodyType = Phaser.Physics.ARCADE;

    createEnemies();

	//  Game Over or You Won!
	stateText = game.add.text(game.world.centerX,game.world.centerY,' ', { font: '50px Helvetica', fill: '#3A3A3A' });
	stateText.anchor.setTo(0.5, 0.5);
	stateText.visible = false;

	//Lives
	livesText = game.add.text(0, 550, ' lives: ' + lives, {font: '30px Helvetica', fill: '#fff'});

	//Joystick control
	GameController.init({
		left: {
			type: 'joystick',
			joystick: {
				touchMove: function(details) {
					game.input.joystickLeft = details;
				},
				touchEnd: function() {
					game.input.joystickLeft = null;
				}
			}
		},
		right: { 
			type: 'joystick',
			joystick: {
				touchMove: function(details) {
					game.input.joystickRight = details;
				},
				touchEnd: function() {
					game.input.joystickRight = null;
				}
			}
		}
	});		
}

function createEnemies(override) {
	if (override) { return;}
	for (var i = 0; i < 10; i++) {
        var evilBunny = enemies.create(Math.random() * 200, Math.random() * 200, 'evilBunny');
		evilBunny.body.immovable = true;
        evilBunny.body.collideWorldBounds = true;
        evilBunny.animations.add('walk');
        evilBunny.animations.play('walk', 15, true);
	}
}

function update() {
	//Evil bunnies cannot move hero
	hero.body.immovable = true;

	//  Run collision to kill enemies from hero's gun
	game.physics.arcade.collide(bullets, enemies, collisionHandler, null, this);
	game.physics.arcade.collide(hero, enemies, enemyHitsPlayer, null, this);

	if (game.input.joystickLeft) {
		moveHero(game.input.joystickLeft.dx * 2, game.input.joystickLeft.dy * 2);
	} else if(game.input.joystickRight) {
		rotateHero(game.input.joystickRight.normalizedX * 1000, game.input.joystickRight.normalizedY * 1000);
		fireBullet(game.input.joystickRight.normalizedX * 200, game.input.joystickRight.normalizedY * 360);
	}
}

function collisionHandler(bullet, evilBunny) {
	//Update score
	score += 1;
	scoreText.text = scoreString + score;
	//  When a bullet hits an enemy and the bullet
	bullet.kill();
	evilBunny.destroy();

	if (enemies.countLiving() === 0) {
		stateText.text = ' You Won, \n Click to restart';
		stateText.visible = true;
		game.input.onTap.addOnce(restart,this);
	}
}

function enemyHitsPlayer(hero, evilBunny) {
	lives--;
	livesText.text = 'lives: ' + lives;

	if (!lives) {
		hero.kill();
		stateText.text=' GAME OVER \n Click to restart';
		stateText.visible = true;
		game.input.onTap.addOnce(restart,this);
	}
}

function fireBullet(x, y) {
	//  To avoid them being allowed to fire too fast we set a time limit
	if (game.time.now > bulletTime)
	{
		//  Grab the first bullet we can from the pool
		bullet = bullets.getFirstExists(false);

		if (bullet)
		{
			bullet.reset(hero.x - 7, hero.y - 26);
			bullet.body.velocity.y = y * -1;
			bullet.body.velocity.x = x;
			bulletTime = game.time.now + 200;
		}
	}

}

function restart() {
	lives = numberOfLives;
	enemies.removeAll();
	createEnemies();
	hero.revive();

	stateText.visible = false;
}

function render() {
	//Debug
	game.debug.spriteInfo(hero, 32, 250);
}

/*
 * HELPER FUNCTIONS
 *
*/

function moveHero(x, y) {
	hero.body.velocity.x = x;
	hero.body.velocity.y = y * -1;
}

function rotateHero(x, y) {
	hero.angle = (x + y);
}

function gofull() { 
	game.scale.startFullScreen(false);
}
