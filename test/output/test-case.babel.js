import { Component } from "animationis"

class FreeContainer extends Component {
  constructor(width, height) {
    super()
    this.width = width
    this.height = height
    this.components = []
  }
  getWidth() { return this.width }
  getHeight() { return this.height }
  addComponent(component, x, y) {
    this.components.push({
      component: component,
      x: x,
      y: y
    })
  }
  render(ctx) {
    this.components.forEach(e => {
      ctx.save()
      ctx.translate(e.x, e.y)
      e.component.render(ctx)
      ctx.restore()
    })
  }
}

class TestComponent extends Component {
  getWidth() { return 20 }
  getHeight() { return 20 }
  render(ctx) {
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.random()})`
    ctx.fillRect(0, 0, 20, 20)
  }
}

const component = new FreeContainer(100, 100)
component.addComponent(new TestComponent(), 0, 0)
component.addComponent(new TestComponent(), 50, 30)

export default [
  {
    fps: 30,
    component: component,
    run: function* () {
      yield
      yield
      yield
      yield
      yield
      yield
      yield
    }
  }
]
