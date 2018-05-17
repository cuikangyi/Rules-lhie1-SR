function isEqual(color1, color2) {
    return color1.runtimeValue().invoke('isEqual', color2)
}

module.exports = {
    isEqual: isEqual
}