var game = new Phaser.Game(800, 600, Phaser.AUTO, 'smoking-carrots', 
	{ preload: preload, create: create, update: update, render: render});

function preload() {
	var IMAGEPATH = 'images/';
	game.load.image('background', IMAGEPATH + 'bg.jpg');
	game.load.image('hero', IMAGEPATH + 'hero.png');
	game.load.image('bullet', IMAGEPATH + 'bullet.png');
	game.load.image('evilBunny', IMAGEPATH + 'enemy.png');

	//gamepad buttons
	game.load.image('buttonvertical', IMAGEPATH + 'buttons/button-vertical.png');
	game.load.image('buttonhorizontal', IMAGEPATH + 'buttons/button-horizontal.png');
	game.load.image('buttonfire', IMAGEPATH + 'buttons/button-round-a.png');
	game.load.image('buttonsuper', IMAGEPATH + 'buttons/button-round-b.png');

	//Full Screen
	game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
	game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;
}

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
var left = false;
var right = false;
var down = false;
var up = false;
var fire = false;
var superPower = false;


function create() {
	if (!game.device.desktop){ game.input.onDown.add(gofull, this); } //go fullscreen on mobile devices

	game.physics.startSystem(Phaser.Physics.ARCADE);

	game.world.setBounds(0, 0, 800, 600);
	game.add.sprite(0,0,'background');

	//  The score
	scoreString = 'Score : ';
	scoreText = game.add.text(10, 10, scoreString + score, { font: '34px Helvetica', fill: '#fff' });

	//The hero
	hero = game.add.sprite(200, 340, 'hero');
	hero.enableBody = true;
	game.physics.enable(hero, Phaser.Physics.ARCADE);

	hero.anchor.setTo(0.5, 0.5);

	//Bullet group
	bullets = game.add.group();
	bullets.enableBody = true;
	bullets.physicsBodyType = Phaser.Physics.ARCADE;
	bullets.createMultiple(30, 'bullet');
	bullets.setAll('anchor.x', 1);
	bullets.setAll('anchor.y', 1);
	bullets.setAll('outOfBoundsKill', true);
	bullets.setAll('checkWorldBounds', true);

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

	// Virtual game controller buttons 
	buttonsuper = game.add.button(600, 500, 'buttonsuper', null, this, 0, 1, 0, 1);  //game, x, y, key, callback, callbackContext, overFrame, outFrame, downFrame, upFrame
	buttonsuper.fixedToCamera = true;  //our buttons should stay on the same place  
	buttonsuper.events.onInputOver.add(function(){ superPower = true; });
	buttonsuper.events.onInputOut.add(function(){ superPower = false; });
	buttonsuper.events.onInputDown.add(function(){ superPower = true; });
	buttonsuper.events.onInputUp.add(function(){ superPower = false; });


	buttonfire = game.add.button(700, 500, 'buttonfire', null, this, 0, 1, 0, 1);
	buttonfire.fixedToCamera = true;
	buttonfire.events.onInputOver.add(function(){fire=true;});
	buttonfire.events.onInputOut.add(function(){fire=false;});
	buttonfire.events.onInputDown.add(function(){fire=true;});
	buttonfire.events.onInputUp.add(function(){fire=false;});        

	buttonleft = game.add.button(0, 472, 'buttonhorizontal', null, this, 0, 1, 0, 1);
	buttonleft.fixedToCamera = true;
	buttonleft.events.onInputOver.add(function(){left=true;});
	buttonleft.events.onInputOut.add(function(){left=false;});
	buttonleft.events.onInputDown.add(function(){left=true;});
	buttonleft.events.onInputUp.add(function(){left=false;});

	buttonright = game.add.button(160, 472, 'buttonhorizontal', null, this, 0, 1, 0, 1);
	buttonright.fixedToCamera = true;
	buttonright.events.onInputOver.add(function(){right=true;});
	buttonright.events.onInputOut.add(function(){right=false;});
	buttonright.events.onInputDown.add(function(){right=true;});
	buttonright.events.onInputUp.add(function(){right=false;});

	buttondown = game.add.button(96, 536, 'buttonvertical', null, this, 0, 1, 0, 1);
	buttondown.fixedToCamera = true;
	buttondown.events.onInputOver.add(function(){ down = true; });
	buttondown.events.onInputOut.add(function(){ down = false ;});
	buttondown.events.onInputDown.add(function(){ down = true; });
	buttondown.events.onInputUp.add(function(){ down = false ;});

	buttonup = game.add.button(96, 400, 'buttonvertical', null, this, 0, 1, 0, 1);
	buttonup.fixedToCamera = true;
	buttonup.events.onInputOver.add(function(){ up = true; });
	buttonup.events.onInputOut.add(function(){ up = false ;});
	buttonup.events.onInputDown.add(function(){ up = true; });
	buttonup.events.onInputUp.add(function(){ up = false ;});
}

function createEnemies() {

	for (var i = 0; i < 10; i++) {
		var enemy = enemies.create(i * Math.random() * 80, i * Math.random() * 50, 'evilBunny');
		enemy.anchor.setTo(0.5, 0.5);
		console.log(enemy.rotation);
		enemy.rotation = game.physics.arcade.angleToXY(enemy, 200, 340);
		//Move enemy to hero
		game.physics.arcade.moveToObject(enemy, hero, 50);
	}
}

function update() {
	//Evil bunnies cannot move hero
	hero.body.immovable = true;

	//  Firing?
	if (fire || game.input.activePointer.isDown) {
		fireBullet();
		//TODO:
		//Figure out to aim bullet towards direction of gun
		//bullet.rotation = game.physics.arcade.angleToPointer(bullet);
	}

	//  Run collision to kill enemies from hero's gun
	game.physics.arcade.collide(bullets, enemies, collisionHandler, null, this);
	game.physics.arcade.collide(hero, enemies, enemyHitsPlayer, null, this);

	// Virtual Controller Commands
	if (left) {
		hero.x -= 5;
		hero.angle += 5;
	} else if (right) {
		hero.x += 5;
		hero.angle -= 5;
	} else if (down && !left && !right) {
		hero.y += 5;
	} else if (up) {
		hero.y -= 5;
	} else if (superPower) {
		//TODO: Add super power here
	} else {
		hero.loadTexture('hero', 0);
	}

	if (game.input.currentPointers === 0 && !game.input.activePointer.isMouse){ fire=false; right=false; left=false; top=false; superPower=false;} //this works around a "bug" where a button gets stuck in pressed state
}

function collisionHandler(bullet, enemy) {
	//Update score
	score += 1;
	scoreText.text = scoreString + score;
	//  When a bullet hits an enemy and the bullet
	bullet.kill();
	enemy.kill();

	if (enemies.countLiving() === 0) {
		stateText.text = ' You Won, \n Click to restart';
		stateText.visible = true;
		game.input.onTap.addOnce(restart,this);
	}
}

function enemyHitsPlayer(hero, enemy) {	
	lives--;
	livesText.text = 'lives: ' + lives;

	if (!lives) {
		hero.kill();
		stateText.text=' GAME OVER \n Click to restart';
		stateText.visible = true;
		game.input.onTap.addOnce(restart,this);
	}
}

function fireBullet () {
	//  To avoid them being allowed to fire too fast we set a time limit
	if (game.time.now > bulletTime)
	{
		//  Grab the first bullet we can from the pool
		bullet = bullets.getFirstExists(false);

		if (bullet)
		{
			bullet.reset(hero.x - 7, hero.y - 26);
			game.physics.arcade.moveToPointer(bullet, 300, game.input.activePointer);
			bulletTime = game.time.now + 200;
		}
	}

}

function restart () {
	lives = numberOfLives;
	enemies.removeAll();
	createEnemies();
	hero.revive();

	stateText.visible = false;
}

function render() {
	//Debug
	game.debug.spriteInfo(hero, 32, 450);
	game.debug.pointer(game.input.activePointer);
}

/*
 * HELPER FUNCTIONS
 *
*/
function gofull() { 
	game.scale.startFullScreen(false);
}
