export default class Component {
  async init() {}
  getSize(): [number, number] {
    throw new Error("getSize() must be overridden")
  }
  render(ctx: CanvasRenderingContext2D) {
    throw new Error("render() must be overridden")
  }
}
