export default class Component {
  async init() {}
  getSize() {
    throw new Error("getSize() must be overridden")
  }
  render(ctx) {
    throw new Error("render() must be overridden")
  }
}
