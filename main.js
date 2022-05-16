// One grid is 20x20

const config = {
  type: Phaser.WEBGL,
  width: 800,
  height: 600,
  backgroundColor: '#53463c',
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

let worm;
let food;
let cursors;
let paused = false;

const directions = {
  UP: 0,
  DOWN: 1,
  LEFT: 2,
  RIGHT: 3,
};

const playBtn = document.getElementById('playBtn');
const score = document.getElementById('score');

let playBtnClicked = false;

const game = new Phaser.Game(config);

// Pause / resume functionality
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape' || event.key === 'Esc') {
    paused ? game.scene.resume('default') : game.scene.pause('default');

    paused = !paused;
  }
});

function preload() {
  this.load.image('background', 'assets/background.png');

  this.load.image('food', 'assets/orange.png');

  this.load.image('body', 'assets/wormTemp.png');
}

function create() {
  this.add.image(400, 300, 'background');

  // Reset score
  score.innerHTML = `Total score: 0`;

  // Restart/start game
  // If playBtnClicked is false (so when game started),
  // Update function checks if it's false and if so game doesn't run.
  playBtn.addEventListener('click', () => {
    this.scene.restart();

    playBtnClicked = true;
    playBtn.innerHTML = 'Restart Game';
  });

  // Worm Food Class
  let Food = new Phaser.Class({
    Extends: Phaser.GameObjects.Image,

    initialize: function Food(scene, x, y) {
      Phaser.GameObjects.Image.call(this, scene);

      this.setTexture('food');
      this.setPosition(x * 20, y * 20);
      this.setOrigin(0);

      this.total = 0;

      scene.children.add(this);
    },

    eat: function () {
      this.total++;

      score.innerHTML = `Total score: ${this.total}`;
    },
  });

  // Worm Class
  let Worm = new Phaser.Class({
    initialize: function Worm(scene, x, y) {
      this.headPosition = new Phaser.Geom.Point(x, y);

      this.body = scene.add.group();

      this.head = this.body.create(x * 20, y * 20, 'body');
      this.head.setOrigin(0);

      this.alive = true;

      this.speed = 100;

      this.moveTime = 0;

      this.tail = new Phaser.Geom.Point(x, y);

      this.heading = directions.RIGHT;
      this.direction = directions.RIGHT;
    },

    update: function (time) {
      if (time >= this.moveTime) {
        return this.move(time);
      }
    },

    faceLeft: function () {
      if (this.direction === directions.UP || this.direction === directions.DOWN) {
        this.heading = directions.LEFT;
      }
    },

    faceRight: function () {
      if (this.direction === directions.UP || this.direction === directions.DOWN) {
        this.heading = directions.RIGHT;
      }
    },

    faceUp: function () {
      if (this.direction === directions.LEFT || this.direction === directions.RIGHT) {
        this.heading = directions.UP;
      }
    },

    faceDown: function () {
      if (this.direction === directions.LEFT || this.direction === directions.RIGHT) {
        this.heading = directions.DOWN;
      }
    },

    move: function (time) {
      /**
       * Based on the heading property we update headPosition.
       *
       * The Math.wrap call allows the worm to wrap around the screen when it goes of.
       */
      switch (this.heading) {
        case directions.LEFT:
          this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x - 1, 0, 40);
          break;

        case directions.RIGHT:
          this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x + 1, 0, 40);
          break;

        case directions.UP:
          this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y - 1, 0, 30);
          break;

        case directions.DOWN:
          this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y + 1, 0, 30);
          break;
      }

      this.direction = this.heading;

      //  Update the body segments
      Phaser.Actions.ShiftPosition(
        this.body.getChildren(),
        this.headPosition.x * 20,
        this.headPosition.y * 20,
        1,
        this.tail
      );

      //  Check to see if any of the body pieces have the same x/y as the head
      //  If they do, the head ran into the body so update snakes "alive" status

      let hitBody = Phaser.Actions.GetFirst(
        this.body.getChildren(),
        { x: this.head.x, y: this.head.y },
        1
      );

      if (hitBody) {
        // TODO: Add some cool die effect?
        console.log('dead');
        playBtn.innerHTML = 'Restart Game';

        this.alive = false;

        return false;
      } else {
        //  Update the timer ready for the next movement
        this.moveTime = time + this.speed;

        return true;
      }
    },

    grow: function () {
      let newPart = this.body.create(this.tail.x, this.tail.y, 'body');

      newPart.setOrigin(0);
    },

    collideWithFood: function (food) {
      if (this.head.x === food.x && this.head.y === food.y) {
        this.grow();

        food.eat();

        //  For every 5 items of food eaten we'll increase the snake speed a little
        if (this.speed > 20 && food.total % 5 === 0) {
          this.speed -= 5;
        }

        return true;
      } else {
        return false;
      }
    },

    updateGrid: function (grid) {
      //  Remove all body pieces from valid positions list
      this.body.children.each(function (segment) {
        var bx = segment.x / 20;
        var by = segment.y / 20;

        grid[by][bx] = false;
      });

      return grid;
    },
  });

  food = new Food(this, 4, 4);

  worm = new Worm(this, 8, 8);

  //  Create our keyboard controls
  cursors = this.input.keyboard.createCursorKeys();
}

function update(time, delta) {
  if (!worm.alive || !playBtnClicked) return;

  /**
   * Check which key is pressed, and then change the direction the worm
   * is heading based on that. The checks ensure you don't double-back
   * on yourself, for example if you're moving to the right and you press
   * the LEFT cursor, it ignores it, because the only valid directions you
   * can move in at that time is up and down.
   *
   * This is defined in the actual faceX functions in the create() function.
   */

  if (cursors.left.isDown) {
    worm.faceLeft();
  } else if (cursors.right.isDown) {
    worm.faceRight();
  } else if (cursors.up.isDown) {
    worm.faceUp();
  } else if (cursors.down.isDown) {
    worm.faceDown();
  }

  if (worm.update(time)) {
    //  If the snake updated, we need to check for collision against food

    if (worm.collideWithFood(food)) {
      repositionFood();
    }
  }
}

/**
 * We can place the food anywhere in our 40x30 grid
 * except on-top of the snake, so we need
 * to filter those out of the possible food locations.
 * If there aren't any locations left, they've won!
 **/

function repositionFood() {
  //  First create an array that assumes all positions
  //  are valid for the new piece of food

  //  A Grid we'll use to reposition the food each time it's eaten
  var testGrid = [];

  for (var y = 0; y < 30; y++) {
    testGrid[y] = [];

    for (var x = 0; x < 40; x++) {
      testGrid[y][x] = true;
    }
  }

  worm.updateGrid(testGrid);

  //  Purge out false positions
  var validLocations = [];

  for (var y = 0; y < 30; y++) {
    for (var x = 0; x < 40; x++) {
      if (testGrid[y][x] === true) {
        //  Is this position valid for food? If so, add it here ...
        validLocations.push({ x: x, y: y });
      }
    }
  }

  if (validLocations.length > 0) {
    //  Use the RNG to pick a random food position
    var pos = Phaser.Math.RND.pick(validLocations);

    //  And place it
    food.setPosition(pos.x * 20, pos.y * 20);

    return true;
  } else {
    return false;
  }
}
