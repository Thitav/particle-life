class Vector2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(vector) {
    this.x += vector.x;
    this.y += vector.y;
    return this;
  }

  mult(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }
}

class Particle {
  velocity = new Vector2(0, 0);

  constructor(position, radius, type, rules, canvas, ctx) {
    this.position = position;
    this.radius = radius;
    this.type = type;
    this.rules = rules;
    this.canvas = canvas;
    this.ctx = ctx;
  }

  updateForces(particles) {
    const resultantForce = new Vector2(0, 0);
    for (let particle of particles) {
      if (particle === this) continue;

      const diff = new Vector2(particle.position.x - this.position.x, particle.position.y - this.position.y);
      const dist = Math.hypot(diff.x, diff.y);
    
      if (dist > this.radius) {
        const force = this.rules[particle.type] / dist;
        resultantForce.add(new Vector2(force * diff.x, force * diff.y));
      }
    }
    this.velocity.add(resultantForce.mult(0.5));
  }

  updatePos() {
    if (this.position.x <= this.canvas.offsetLeft || this.position.x >= this.canvas.width) {
      this.velocity.x = -this.velocity.x;
    }
    if (this.position.y <= this.canvas.offsetTop || this.position.y >= this.canvas.height) {
      this.velocity.y = -this.velocity.y;
    }
    this.position.add(this.velocity);
  }

  stability(particles) {
    let resultantDistance = 0;
    for (let particle of particles) {
      if (particle === this || particle.type !== this.type) continue;
      const diff = new Vector2(particle.position.x - this.position.x, particle.position.y - this.position.y);
      const dist = Math.hypot(diff.x, diff.y);
      resultantDistance += dist;
    }
    return resultantDistance;
  }

  draw() {
    this.ctx.fillStyle = this.type;
    this.ctx.beginPath();
    this.ctx.ellipse(this.position.x, this.position.y, this.radius, this.radius, 0, 0, 2 * Math.PI);
    this.ctx.fill();
  }
}

class Simulation {
  particles = [];
  evaluations = [];

  constructor(rules, nparticles, canvas) {
    this.rules = rules;    
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    for (const type of Object.keys(nparticles)) {
      for (let i=0; i<nparticles[type]; i++) {
        this.particles.push(new Particle(new Vector2(Math.random() * canvas.width, Math.random() * canvas.height), 2, type, rules[type], this.canvas, this.ctx));
      }
    }
  }

  simulate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let particle of this.particles) {
      particle.updateForces(this.particles);
      particle.updatePos();
      particle.draw(this.ctx);
    }
  }

  evaluate() {
    let stability = 0;
    for (let particle of this.particles) {
      stability += particle.stability(this.particles);
    }
    this.evaluations.push(stability);
    return stability;
  }

  result() {
    return this.evaluations.reduce((sum, x) => sum + x, 0) / this.evaluations.length;
  }
}

const particles = {
  red: 100,
  blue: 100,
  green: 100,
  yellow: 100,
}

const display = document.getElementById("display");
display.style.display = "grid"; 
display.style.gridTemplateColumns = "auto auto"; 

const simulations = [];
for (let i=0; i<4; i++) {
  const canvas = document.createElement("canvas");
  canvas.style.width = "950px";
  canvas.style.height = "460px";
  canvas.style.backgroundColor = "black";

  display.appendChild(canvas);
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const rules = {
    red: {
      blue: (Math.random() - 0.5),
      green: (Math.random() - 0.5),
      red: (Math.random() - 0.5),
      yellow: (Math.random() - 0.5),    
    },
    blue: {
      red: (Math.random() - 0.5),
      green: (Math.random() - 0.5),
      blue: (Math.random() - 0.5),  
      yellow: (Math.random() - 0.5),  
    },
    green: {
      red: (Math.random() - 0.5),
      blue: (Math.random() - 0.5),
      green: (Math.random() - 0.5), 
      yellow: (Math.random() - 0.5),   
    },
    yellow: {
      red: (Math.random() - 0.5),
      blue: (Math.random() - 0.5),
      green: (Math.random() - 0.5),
      yellow: (Math.random() - 0.5),
    }
  }

  const simulation = new Simulation(rules, particles, canvas);
  simulations.push(simulation);
}

let counter = 0;

function simulate() {
  for (const simulation of simulations) {
    simulation.simulate();
    if (counter > 90) {
      simulation.evaluate();
    }
    if (counter < 100) {
      requestAnimationFrame(simulate);
    } else {
      const mean = simulation.result();
 
      let variance = 0;
      for (const val of simulation.evaluations) {
        variance += (val - mean)**2;
      }
      variance /= simulation.evaluations.length;
      variance = Math.sqrt(variance);
      console.log("VAR", variance)
    }
  }
  counter++;
}
requestAnimationFrame(simulate);
