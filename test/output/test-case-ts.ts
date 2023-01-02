import { Stage, Component } from "animationis"

type ChildComponent = {
  component: Component
  pos: [number, number]
}

class FreeContainer extends Component {
  private components: ChildComponent[] = []
  constructor(private readonly size: [number, number]) {
    super()
  }
  getSize() { return this.size }
  addComponent(component: Component, pos: [number, number]) {
    this.components.push({
      component: component,
      pos: pos
    })
  }
  render(ctx: CanvasRenderingContext2D) {
    this.components.forEach(e => {
      ctx.save()
      ctx.translate(e.pos[0], e.pos[1])
      e.component.render(ctx)
      ctx.restore()
    })
  }
}

class TestComponent extends Component {
  getSize(): [number, number] { return [20, 20] }
  render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.random()})`
    ctx.fillRect(0, 0, 20, 20)
  }
}

const component = new FreeContainer([100, 100])
component.addComponent(new TestComponent(), [0, 0])
component.addComponent(new TestComponent(), [50, 30])

export default <Stage[]>[
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
