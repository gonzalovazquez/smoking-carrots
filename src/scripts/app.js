var game = new Phaser.Game(568, 320, Phaser.CANVAS, 'smoking-carrots', 
	{ preload: preload, create: create, update: update, render: render});

var bullets;
var fireButton;
var bulletTime = 0;
var hero;
var cursor;
var zombies;
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
	game.load.spritesheet('zombieBunny', IMAGEPATH + 'sprites/zombie-bunnies.png', 62, 62, 10);

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
	game.physics.enable(hero, Phaser.Physics.ARCADE);
	hero.enableBody = true;
	hero.body.collideWorldBounds = true;
	hero.body.immovable = false;

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

	//Bad Guys group
	zombies = game.add.group();
	zombies.enableBody = true;
	zombies.physicsBodyType = Phaser.Physics.ARCADE;

	createZombies(true);

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

	// Camera control
	game.camera.follow(hero);
	game.camera.deadzone = new Phaser.Rectangle(150, 150, 150, 150);
	game.camera.focusOnXY(0, 0);
}

function createZombies(override) {
	if (!override) { return;}
	for (var i = 0; i < 10; i++) {
		var zombieBunny = zombies.create(Math.random() * 500, Math.random() * 500, 'zombieBunny');
		zombieBunny.body.immovable = true;
		zombieBunny.body.collideWorldBounds = true;
		zombieBunny.animations.add('walk');
		zombieBunny.animations.play('walk', 15, true);
		game.physics.arcade.moveToObject(zombieBunny, hero, 50);
	}
}

function update() {
	//Evil bunnies cannot move hero
	hero.body.immovable = true;

	//  Run collision to kill enemies from hero's gun
	game.physics.arcade.collide(bullets, zombies, collisionHandler, null, this);
	game.physics.arcade.collide(hero, zombies, enemyHitsPlayer, null, this);

	if (game.input.joystickLeft) {
		moveHero(game.input.joystickLeft.dx * 2, game.input.joystickLeft.dy * 2);
	} else if(game.input.joystickRight) {
		rotateHero(game.input.joystickRight.normalizedX * 1000, game.input.joystickRight.normalizedY * 1000);
		fireBullet(game.input.joystickRight.normalizedX * 200, game.input.joystickRight.normalizedY * 360);
	}

	zombies.angle = game.physics.arcade.angleBetween(zombies, hero);
}

function collisionHandler(bullet, evilBunny) {
	//Update score
	score += 1;
	scoreText.text = scoreString + score;
	//  When a bullet hits an enemy and the bullet
	bullet.kill();
	evilBunny.destroy();

	if (zombies.countLiving() === 0) {
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
	zombies.removeAll();
	createZombies();
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