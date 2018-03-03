export default class Component {
  getWidth() {
    throw new Error("getWidth() must be overrided")
  }
  getHeight() {
    throw new Error("getHeight() must be overrided")
  }
  render(ctx) {
    throw new Error("render() must be overrided")
  }
}
