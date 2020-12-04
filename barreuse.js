/*
v9 copy
normal transitions
*/

window.groupedbar = (function() {
  var chart = function() {

    var rects;
    var tooltip;
    var margin = {top: 20, right: 20, bottom: 30, left: 40};
    var outerWidth = 960;
    var outerHeight = 500;
    var transitionTime = 1500;
    var x0 = d3.scale.ordinal();
    var x1 = d3.scale.ordinal();
    var y = d3.scale.linear();
    var color = d3.scale.ordinal()
      //.range(["#ff3335", "#f5a600", "#ffd933", "#72f3db", "#ffff00", "#551a8b"]);
      .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
    //var colors = ["#ff0000", "#ffa500", "#ffff00", "#00ff00", "#0000ff", "#cc00ff"];
    var xAxis = d3.svg.axis()
      .scale(x0)
      .orient("bottom");
    var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickFormat(d3.format("s"));
    var fixScale = false;
    var fixScaleMax = 410;

    var my = function(selection) {
      //set inner width and height
      var innerWidth  = outerWidth  - margin.left - margin.right;
      var innerHeight = outerHeight - margin.top  - margin.bottom;

      //set x and y scales
      x0.rangeRoundBands([0, innerWidth], .1);
      y.range([innerHeight, 0]);

      //d is data, 'this' is dom element
      selection.each(function(e, i) {
        //get position names
        var positionNames = d3.keys(e[0]).filter(function(key) { return key !== "Position"; });
        //set values
        e.forEach(function(d) {
          d.points = positionNames.map(function(name) { return {name: name, value: +d[name]}; });
        });

        //set scales
        x0.domain(e.map(function(d) { return d.Position; }));
        x1.domain(positionNames).rangeRoundBands([0, x0.rangeBand()]);

        if (fixScale) {
          y.domain([0, fixScaleMax]);
        } else {
          //0 to max value y scale
          y.domain(
            [0, d3.max(e, function(d) { 
              return d3.max(d.points, function(f) { 
                return f.value; 
              }); 
            })
          ]);
        }

        //fixed y scale
        //y.domain([0, 30]);

        //data bind
        var svg = d3.select(this).selectAll("svg").data([e]);
        var gEnter = svg.enter().append("svg").append("g")
          .attr("class", "groupbarg")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        var g = svg.select("g");

        if (!tooltip) {
          tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
        }

        //define svg dimensions
        svg.attr("width", outerWidth)
          .attr("height", outerHeight);

        //x axis append
        gEnter.append("g")
            .attr("class", "x axis");

        //y axis append
        gEnter.append("g")
            .attr("class", "y axis")
            .append("text")
            .attr("class", "label")
            .style("text-anchor", "middle");

        //set x axis
        g.select(".x.axis")
            .attr("transform", "translate(0," + innerHeight + ")")
            .transition()
            .duration(((2 * transitionTime) / 3))
            .call(xAxis);

        //set y axis
        g.select(".y.axis")
            .transition()
            .duration(transitionTime)
            .call(yAxis)
            .select("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 3)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Fantasy Points");

        var groups = g.selectAll(".group")
          .data(e);

        groups.exit()
            .transition()
            .duration(transitionTime)
          .style("opacity", 0)
          .attr("transform", "translate(" + outerWidth + ", 0)")
          .remove();

        groups.enter().append("g")
            .attr("class", "group")
            .attr("transform", function(d) {
              return "translate(" + outerWidth + ",0)"; 
            });

        if (!rects) {
          groups.attr("transform", function(d) {
              return "translate(" + x0(d.Position) + ",0)"; 
            });
        } else {
          groups.transition()
            .duration(1500)
            .attr("transform", function(d) {
              return "translate(" + x0(d.Position) + ",0)"; 
            })
            .style("opacity", 1);
        }

        rects = groups.selectAll("rect")
            .data(function(d) { 
              return d.points; 
            });

        rects.exit()
            .transition()
            .duration(transitionTime)
          .attr("y", innerHeight)
          .attr("x", x0.rangeBand())
          .attr("height", 0)
          .attr("width", 0)
          .remove();
          
        rects.enter().append("rect")
          .style("fill", function(d, i) { return color(d.name); })
          .attr("x", function(d) { return x1(d.name); })
          .attr("y", innerHeight)
          .attr("height", 0)
          .attr("width", x1.rangeBand())
          .on("mouseover", function(d) {
            tooltip.html("" + d.name + ": " + Math.round(d.value * 100) / 100)
              .transition()
              .duration(200)
              .style("opacity", 0.9);
          })
          .on("mousemove", function(d) {
            tooltip.style("left", (d3.event.pageX) + "px")
              .style("top", (d3.event.pageY - 10) + "px");
          })
          .on("mouseout", function(d) {
            tooltip.transition()
              .duration(200)
              .style("opacity", 0)
          });

        rects.transition()
            .duration(transitionTime)
          .attr("x", function(d) { return x1(d.name); })
          .attr("width", x1.rangeBand())
          .style("fill", function(d, i) { return color(d.name); })
          .attr("y", function(d) { return y(d.value); })
          .attr("height", function(d) { return innerHeight - y(d.value); });

        var legend = g.selectAll(".legend")
          //.data(positionNames.slice().reverse())
          .data(positionNames)

        legend.exit()
          .transition()
          .duration(transitionTime)
          .style("opacity", 0)
          .remove();

        legend.enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; })
            .style("opacity", 0);

        legend.transition()
          .duration(transitionTime)
          .style("opacity", 1);

        legend.selectAll("rect").remove();

        legend.append("rect")
            .attr("x", innerWidth - 18)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", color);

        legend.selectAll("text").remove();

        legend.append("text")
            .attr("x", innerWidth - 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(function(d) { return d; });



        /*

        legend.enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

        legend.append("rect")
            .attr("x", innerWidth - 18)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", color);

        legend.append("text")
            .attr("x", innerWidth - 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(function(d) { return d; });
        */

      });
    };

    //sets margin
    my.margin = function(value) {
        if (!arguments.length) return margin;
        margin = value;
        return my;
    };

    //sets width
    my.width = function(value) {
        if (!arguments.length) return outerWidth;
        outerWidth = value;
        return my;
    };

    //sets height
    my.height = function(value) {
        if (!arguments.length) return outerHeight;
        outerHeight = value;
        return my;
    };

    //sets color scheme
    my.color = function(value) {
        if (!arguments.length) return color;
        color = value;
        return my;
    };

    //sets whether or not the y scale should be fixed
    my.fixScale = function(value) {
        if (!arguments.length) return fixScale;
        fixScale = value;
        return my;
    };

    //sets the max y value for the fixed scale
    my.fixScaleMax = function(value) {
        if (!arguments.length) return fixScaleMax;
        fixScaleMax = value;
        return my;
    };

    return my;
  };

  return chart;
})();