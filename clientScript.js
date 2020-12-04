/*
v5 copy, added deffered queue for quicker csv loading and for deciding which positions
to include
*/

(function() {

    //chart variables
    var width = 960;
    var height = 700;
    var fixScaleMax = 415;
    var fixScale = false;
    var color = d3.scale.ordinal()
      .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
    var margin = {top: 20, right: 20, bottom: 30, left: 40};
    var myChart = groupedbar();
    var chartWrapper;

    //data variables
    var yearRange = [2014, 2015];
    var positions = [1, 1, 1, 1];
    var rankGroupSize = 1;
    var perGame = false;
    var minGamesStarted = 6; 
    var rankRange = [1, 20];
    var rankSize = 1;

    //other
    //var fixScaleMaxScale = d3.scale.linear().domain([1, 16]).range([])

    //END GLOBAL VARIABLES

    $(document).ready(function() {
        chartWrapper = d3.select("#grapharea");
        chartCall();

        //Slider for year range (https://jqueryui.com/slider/)
        $(function() {
            $("#yearslider").slider({
                min: 1992,
                max: 2015,
                range: true,
                orientation: "horizontal",
                values: yearRange,
                change: function(event, ui) {
                    $("#minyear").html($(this).slider('values', 0));
                    $("#maxyear").html($(this).slider('values', 1));
                    yearRange = [$(this).slider('values', 0), $(this).slider('values', 1)];
                    chartCall();
                }
            });
        });

        //Slider for max rank range (https://jqueryui.com/slider/)
        $(function() {
            $("#rankrangeslider").slider({
                min: 1,
                max: 40,
                range: true,
                values: rankRange,
                change: function(event, ui) {
                    $("#minrankrange").html($(this).slider('values', 0));
                    $("#maxrankrange").html($(this).slider('values', 1));
                    rankRange = [$(this).slider('values', 0), $(this).slider('values', 1)];
                    chartCall();
                }
            });
        });

        //Slider for max rank range (https://jqueryui.com/slider/)
        $(function() {
            $("#ranksizeslider").slider({
                min: 1,
                max: 10,
                values: rankSize,
                change: function(event, ui) {
                    $("#ranksize").html($(this).slider('values', 0));
                    rankSize = $(this).slider('values', 0);
                    chartCall();
                }
            });
        });

        $("#fixedscale").change(function() {
            fixScale = $("#fixedscale").is(':checked');
            if (fixScale) {
                if (perGame) {
                    fixScaleMax = 30;
                } else {
                    fixScaleMax = 415;
                }
                chartCall();
            } else {
                chartCall();
            }
        });

        $("#pergame").change(function() {
            perGame = $("#pergame").is(':checked');
            if (perGame) {
                $("#pergamearea").append(function(d) {
                    var theHtml = "<div id='mingamesarea'>Min Games:<select id='mingames'>";
                    for (var i = 1; i <= 16; i++) {
                        theHtml += "<option value='" + i + "'";
                        if (i == 6) {
                            theHtml += " selected";
                        }
                        theHtml += ">" + i + "</option>";
                    }
                    theHtml += "</select></div>";
                    return theHtml;
                });
                fixScaleMax = 30;
                minGamesStarted = 6;
                chartCall();
                $("#mingames").change(function() {
                    minGamesStarted = $(this).val();
                    chartCall();
                });
            } else {
                $("#mingamesarea").remove();
                fixScaleMax = 415;
                chartCall();
            }
        });

        $("#showqb").change(function() {
            if ($("#showqb").is(':checked')) {
                positions[0] = 1;
            } else {
                positions[0] = 0;
            }
            chartCall();
        });

        $("#showrb").change(function() {
            if ($("#showrb").is(':checked')) {
                positions[1] = 1;
            } else {
                positions[1] = 0;
            }
            chartCall();
        });

        $("#showwr").change(function() {
            if ($("#showwr").is(':checked')) {
                positions[2] = 1;
            } else {
                positions[2] = 0;
            }
            chartCall();
        });

        $("#showte").change(function() {
            if ($("#showte").is(':checked')) {
                positions[3] = 1;
            } else {
                positions[3] = 0;
            }
            chartCall();
        });

    });

    //END READY CALL

    //function that prepares all the updated data and calls the chart
    function chartCall() {
        d3.queue()
            .defer(d3.csv, "nflquarterbacks19912015yearly.csv")
            .defer(d3.csv, "nflrunningbacks19912015yearly.csv")
            .defer(d3.csv, "nflwidereceivers19912015yearly.csv")
            .defer(d3.csv, "nfltightends19912015yearly.csv")
            .await(readyCall);
    }

    function readyCall(error, d, e, f, g) {
        var data = [];
        var sortedQB = sortByFantasyPoints(d, "qb");
        var sortedRB = sortByFantasyPoints(e, "rb");
        var sortedWR = sortByFantasyPoints(f, "wr");
        var sortedTE = sortByFantasyPoints(g, "te");
        for (var i = rankRange[0] - 1; i < rankRange[1]; i += rankSize) {
            var row = [];
            var qbSum = 0;
            var rbSum = 0;
            var wrSum = 0;
            var teSum = 0;
            //for summing all points in rank group
            for (var h = 0; h < rankSize; h++) {
                var qbYearlySum = 0;
                var rbYearlySum = 0;
                var wrYearlySum = 0;
                var teYearlySum = 0;
                //for summing all points for each rank over the years
                for (var j = 0; j < sortedQB.length; j++) {
                    qbYearlySum += sortedQB[j][i + h].FantasyPoints;
                    rbYearlySum += sortedRB[j][i + h].FantasyPoints;
                    wrYearlySum += sortedWR[j][i + h].FantasyPoints;
                    teYearlySum += sortedTE[j][i + h].FantasyPoints;
                }
                //average the points for each rank over the years
                qbSum += qbYearlySum / sortedQB.length;
                rbSum += rbYearlySum / sortedRB.length;
                wrSum += wrYearlySum / sortedWR.length;
                teSum += teYearlySum / sortedTE.length;
            }
            //Average group totals by number of ranks in group rank
            if (positions[0] == 1) {
                row["QB"] = qbSum / rankSize;
            }
            if (positions[1] == 1) {
                row["RB"] = rbSum / rankSize;
            }
            if (positions[2] == 1) {
                row["WR"] = wrSum / rankSize;
            }
            if (positions[3] == 1) {
                row["TE"] = teSum / rankSize;
            }
            if (rankSize == 1) {
                row["Position"] = "Rank " + (i + 1) + "";
            } else {
                row["Position"] = "Ranks " + (i + 1) + "-" + (i + rankSize);
            }
            data.push(row);
        }
        myChart.width(width).height(height).margin(margin)
            .fixScale(fixScale).fixScaleMax(fixScaleMax).color(color);
        chartWrapper.datum(data).call(myChart);
    }

    //Function that takes the dataset, year range, and position and orders them
    //by fantasy points then returns the dataset
    function sortByFantasyPoints(data, position) {
        var allYearsSorted = [];
        for (var i = yearRange[0]; i <= yearRange[1]; i++) {
            //filter down to relevant players
            var filterSet = data.filter(function(d) {
                if (+d["Year"] == i) {
                    return d;
                }
            });
            //calculate their fantasy points
            if (position == "qb") {
                for (var j = 0; j < filterSet.length; j++) {
                    filterSet[j].FantasyPoints = qbFantasyPoints(filterSet[j]);
                }
            } else if (position == "rb") {
                for (var j = 0; j < filterSet.length; j++) {
                    filterSet[j].FantasyPoints = rbFantasyPoints(filterSet[j]);
                }
            } else {
                for (var j = 0; j < filterSet.length; j++) {
                    filterSet[j].FantasyPoints = wrTeFantasyPoints(filterSet[j]);
                }
            }
            //sort them in order of fantasy points
            filterSet.sort(function(a, b) {
                return b.FantasyPoints-a.FantasyPoints
            });
            allYearsSorted.push(filterSet);
        }
        return allYearsSorted;
    }

    //Function for calculating QB's fantasy points
    function qbFantasyPoints(qb) {
        //Points for Passing Yards
        var fantasyPoints = Math.floor(parseInt(qb.PassingYards.replace(/,/g, '').replace('--', '0')) / 25);
        //Points for Passing TD's
        fantasyPoints += qb.PassingTDs.replace('--', '0') * 4;
        //Points deducted for Passing Int's
        fantasyPoints -= qb.PassingInts.replace('--', '0') * 2;
        //Points for Rushing Yards
        fantasyPoints += Math.floor(parseInt(qb.RushingYards.replace(/,/g, '').replace('--', '0')) / 10);
        //Points for Rushing TDs
        fantasyPoints += qb.RushingTDs.replace('--', '0') * 6;
        //Points deducted for Fumbles Lost
        fantasyPoints -= qb.FumblesLost.replace('--', '0') * 2;
        //Divide by number of games started, if calculating by game
        if (perGame) {
            var gameStarts = +qb.GamesPlayed.replace('--', '0');
            if (gameStarts >= minGamesStarted) {
                fantasyPoints = fantasyPoints / gameStarts;
                if (!isFinite(fantasyPoints)) {
                    fantasyPoints = 0;
                }
            } else {
                fantasyPoints = 0;
            }
        }
        return fantasyPoints;
    }

    //Function for calculating RB's fantasy points
    function rbFantasyPoints(rb) {
        //Points for Rushing Yards
        var fantasyPoints = Math.floor(parseInt(rb.RushingYards.replace(/,/g, '').replace('--', '0')) / 10);
        //Points for Rushing TDs
        fantasyPoints += rb.RushingTDs.replace('--', '0') * 6;
        //Points for Receiving Yards
        fantasyPoints += Math.floor(parseInt(rb.ReceivingYards.replace(/,/g, '').replace('--', '0')) / 10);
        //Points for Receiving TDs
        fantasyPoints += rb.ReceivingTDs.replace('--', '0') * 6;
        //Points deducted for Fumbles Lost
        fantasyPoints -= rb.FumblesLost.replace('--', '0') * 2;
        //Divide by number of games started, if calculating by game
        if (perGame) {
            var gameStarts = +rb.GamesPlayed.replace('--', '0');
            if (gameStarts >= minGamesStarted) {
                fantasyPoints = fantasyPoints / gameStarts;
                if (!isFinite(fantasyPoints)) {
                    fantasyPoints = 0;
                }
            } else {
                fantasyPoints = 0;
            }
        }
        return fantasyPoints;
    }

    //Function for calculating WR's and TE's fantasy points
    function wrTeFantasyPoints(wrTe) {
        //Points for Receiving Yards
        var fantasyPoints = Math.floor(parseInt(wrTe.ReceivingYards.replace(/,/g, '').replace('--', '0')) / 10);
        //Points for Receiving TDs
        fantasyPoints += wrTe.ReceivingTDs.replace('--', '0') * 6;
        //Points for Rushing Yards
        fantasyPoints += Math.floor(parseInt(wrTe.RushingYards.replace(/,/g, '').replace('--', '0')) / 10);
        //Points for Rushing TDs
        fantasyPoints += wrTe.RushingTDs.replace('--', '0') * 6;
        //Points deducted for Fumbles Lost
        fantasyPoints -= wrTe.FumblesLost.replace('--', '0') * 2;
        //Divide by number of games started, if calculating by game
        if (perGame) {
            var gameStarts = +wrTe.GamesPlayed.replace('--', '0');
            if (gameStarts >= minGamesStarted) {
                fantasyPoints = fantasyPoints / gameStarts;
                if (!isFinite(fantasyPoints)) {
                    fantasyPoints = 0;
                }
            } else {
                fantasyPoints = 0;
            }
        }
        return fantasyPoints;
    }

    //Function for getting a random int
    function randomDouble(min,max) {
        return Math.random()*(max-min+1)+min;
    }
})();