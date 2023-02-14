(function ($) {

    var defaultOptions = {
        size: 60,
        borderSize: 10,
        colorCircle: 'gray',
        background: 'white',
        fontFamily: 'sans-serif',
        fontColor: '#333333',
        fontSize: 16,
        delayToFadeIn: 0,
        delayToFadeOut: 0,
        reverseLoading: false,
        reverseRotation: false,
        duration: {
            hours: 0,
            minutes: 0,
            seconds: 10
        },
        beforeStart: function(){},
        end: function(){}
    };

    $.fn.circularCountDown = function (options) {
        new CircularCountDown(options, $(this));
    };

    function CircularCountDown(data, element) {
        this.element = element;
        this.data = jQuery.extend(true, {}, defaultOptions, data);
        this.init();
    }

    CircularCountDown.prototype = {
        init: function () {
            this.formatData();
            this.draw();
            this.start();
        },
        start: function () {
            if (typeof this.data.beforeStart == "function") {
                this.data.beforeStart(this);
            }
            this.show();
            this.starDecrementTimeEvent();
            var time = this.getFormattedTimeByCircle();
            this.animate(time);
        },
        animate: function(time) {
            var that = this;

            if (!that.data.reverseLoading) {
                that.wrapperCircles.css(
                    'clip',
                    'rect(0px, ' + that.data.size + 'px, ' + that.data.size + 'px, ' + (that.data.size / 2) + 'px)'
                );
                that.rotate(that.circlelRight, 0, 180, time, function () {
                    that.wrapperCircles.css('clip', 'rect(auto, auto, auto, auto)');
                    that.rotate(that.circlelLeft, 180, 360, time);
                });
            } else {
                that.rotate(that.circlelRight, 180, 360, time, function() {
                    that.wrapperCircles.css(
                        'clip',
                        'rect(0px, ' + (that.data.size / 2) + 'px, ' + that.data.size + 'px, 0px)'
                    );
                    that.rotate(that.circlelLeft, 0, 180, time);
                    that.rotate(that.circlelRight, 0, 180, time);
                });
            }
        },
        formatData: function () {
            this.time =
                this.data.duration.seconds +
                (this.data.duration.minutes * 60) +
                (this.data.duration.hours * 3600)
            ;
            this.data.size = parseInt(this.data.size);
            this.data.borderSize = parseInt(this.data.borderSize);

            if (this.data.borderSize % 2 != 0) {
                this.data.borderSize++;
            }

            if (this.data.size % 2 != 0) {
                this.data.size++;
            }
        },
        draw: function () {
            this.hide();
            this.circlelLeft = this.drawCircle().addClass('coutndown-circle-left');
            this.circlelRight = this.drawCircle().addClass('coutndown-circle-right');
            this.wrapperCircles = $('<div>')
                .addClass('coutndown-wrapper')
                .css({
                    'width': this.data.size + 'px',
                    'height': this.data.size + 'px',
                    'position': 'absolute',
                })
                .append(this.circlelLeft)
                .append(this.circlelRight)
            ;
            this.wrapperTime = this.drawTime();
            this.element
                .css({
                    'position': 'relative',
                    'box-sizing': 'content-box'
                })
                .append(this.wrapperCircles)
                .append(this.wrapperTime)
            ;
            this.setTime(this.getStringTime(this.time));
        },
        drawCircle: function () {
            var size = this.data.size - (this.data.borderSize * 2);
            size += 'px';
            return $('<div>')
                .addClass('coutndown-circle')
                .css({
                    'width': size,
                    'height': size,
                    'border': this.data.borderSize + 'px solid ' + this.data.colorCircle,
                    '-moz-border-radius': this.data.size + 'px',
                    '-webkit-border-radius': this.data.size + 'px',
                    '-o-border-radius': this.data.size + 'px',
                    '-ms-border-radius': this.data.size + 'px',
                    'border-radius': this.data.size + 'px',
                    'box-sizing': 'content-box',
                    'background-color': this.data.background,
                    'position': 'absolute',
                    'clip': 'rect(0px, ' + (this.data.size / 2) + 'px, ' + this.data.size + 'px, 0px)'
                });
        },
        rotate: function (elem, startAngle, endAngle, duration, complete) {
            $({deg: startAngle}).animate({deg: endAngle}, {
                duration: duration,
                easing: 'linear',
                step: function (now) {
                    elem.css({
                        '-moz-transform': 'rotate(' + now + 'deg)',
                        '-webkit-transform': 'rotate(' + now + 'deg)',
                        '-o-transform': 'rotate(' + now + 'deg)',
                        '-ms-transform': 'rotate(' + now + 'deg)',
                        'transform': 'rotate(' + now + 'deg)'
                    });
                },
                complete: complete || $.noop
            });
        },
        hide: function () {
            this.element.fadeOut(this.data.delayToFadeOut);
            this.visible = false;
        },
        show: function () {
            this.element.fadeIn(this.data.delayToFadeIn);
            this.visible = true;
        },
        isVisible: function () {
            return this.visible;
        },
        getStringTime: function (time) {
            var duration = this.secondsToTime(time);

            if (duration.h > 0) {
                return this.addDigit(duration.h) + ':' + this.addDigit(duration.m) + ':' + this.addDigit(duration.s);
            }
            if (duration.m > 0) {
                return this.addDigit(duration.m) + ':' + this.addDigit(duration.s);
            }
            return this.addDigit(duration.s);
        },
        addDigit: function (number) {
            return ("0" + number).slice(-2);
        },
        secondsToTime: function (time) {
            var hours = Math.floor(time / (60 * 60));
            var divisor_for_minutes = time % (60 * 60);
            var minutes = Math.floor(divisor_for_minutes / 60);
            var divisor_for_seconds = divisor_for_minutes % 60;
            var seconds = Math.ceil(divisor_for_seconds);
            return {
                h: hours,
                m: minutes,
                s: seconds
            };
        },
        getFormattedTimeByCircle: function () {
            var time = this.time / 2 * 1000;

            if (time % 2 != 0) {
                time++;
            }
            return time;
        },
        starDecrementTimeEvent: function () {
            var that = this;
            this.decrementTimeEvent = setInterval(function () {
                that.time -= 1;
                that.setTime(that.getStringTime(that.time));
                if (that.time <= 0) {
                    that.time = 0;
                    that.stopDecrementTimeEvent();

                    if (typeof that.data.end == "function") {
                        that.data.end(that);
                    }
                }
            }, 1000);
        },
        stopDecrementTimeEvent: function () {
            clearInterval(this.decrementTimeEvent);
        },
        drawTime: function () {
            return $('<div>')
                .addClass('coutndown-wrapper-time')
                .css({
                    'position': 'absolute',
                    'height': this.data.size + 'px',
                    'width': this.data.size + 'px',
                    'line-height': this.data.size + 'px',
                    'text-align': 'center',
                    'font-size': this.data.fontSize + 'px',
                    'font-family': this.data.fontFamily,
                    'color': this.data.fontColor
                })
                ;
        },
        setTime: function (time) {
            this.wrapperTime.html(time);
        },
        destroy: function() {
            this.hide();
            this.element.html('').attr('style', null);
            this.circlelLeft = null;
            this.circlelRight = null;
            this.wrapperCircles = null;
            this.element = null;
            this.data = defaultOptions;
        }
    };

}(jQuery));
