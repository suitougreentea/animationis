import { Component } from "animationis"

class FreeContainer extends Component {
  constructor(size) {
    super()
    this.size = size
    this.components = []
  }
  getSize() { return this.size }
  addComponent(component, pos) {
    this.components.push({
      component: component,
      pos: pos
    })
  }
  render(ctx) {
    this.components.forEach(e => {
      ctx.save()
      ctx.translate(e.pos[0], e.pos[1])
      e.component.render(ctx)
      ctx.restore()
    })
  }
}

class TestComponent extends Component {
  getSize() { return [20, 20] }
  render(ctx) {
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.random()})`
    ctx.fillRect(0, 0, 20, 20)
  }
}

const component = new FreeContainer([100, 100])
component.addComponent(new TestComponent(), [0, 0])
component.addComponent(new TestComponent(), [50, 30])

export default [
  {
    fps: 5,
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
