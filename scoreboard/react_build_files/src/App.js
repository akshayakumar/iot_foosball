import React, { Component } from 'react';
// import ReactDOM from 'react-dom';
// import Scoreboard from './modules/main.js';
import Scoreboard from 'react-scoreboard';
import HomeLogo from './devnet_square.png'
import AwayLogo from './sandbox.png'
// import logo from './logo.svg';
import './App.css';
import PropTypes from 'prop-types'
import sizeMe from 'react-sizeme'
import Confetti from 'react-confetti'
import io from 'socket.io-client';
// import Leaderboard from 'react-native-leaderboard';
import ReactSpeedometer from "react-d3-speedometer";
import Sound from 'react-sound';
import singleDing from './single_ding.wav';
import winSound from './win.wav';

// const socket = io('http://localhost:3003') //For local dev
const socket = io();

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      'team1_score': 0,
      'team2_score': 0,
      'game_live': false,
      'time': 180,
      'confetti_recycle': false,
      'confetti_run': false,
      'home_label': 'Team 1',
      'away_label': 'Team 2',
      'timer_interval': null,
      'winningTimeout': null,
      'ballSpeed': 5,
      'playUrl': null,
      'playStatus': 'STOPPED'
    }
  }

  componentDidMount() {
    
    socket.on('hello', data => {
      console.log('connected via socket');
      this.setState({winningTimeout: data.winningTimeout});
      console.log('Received timeout from server of: '+data.winningTimeout);
    });
  
    socket.on('scoreUpdate', scoreUpdate => {
      //console.log('received scoreUpdate');
      //console.log(scoreUpdate);
      // scoreUpdate = JSON.parse(scoreUpdate)
      this.processScoreUpdate(scoreUpdate);
    });

    socket.on('speedUpdate', speedUpdate => {
      //console.log('received speedUpdate');
      //console.log(speedUpdate);
      // scoreUpdate = JSON.parse(scoreUpdate)
      this.processSpeedUpdate(speedUpdate.speed);
    });

    this.startTimer();
    // setInterval(this.incrementScore, 1000);
    
  }

  processSpeedUpdate = (speed) => {
    this.setState({ballSpeed:speed})
  }

  processScoreUpdate = (scoreUpdate) => {
    if(scoreUpdate.winner === false){
      this.setScore(scoreUpdate)
    }
    else if (scoreUpdate.winner === true){
      this.setWinner(scoreUpdate,this.state.winningTimeout)
    }
  }

  timer = () => {
    let seconds = this.state.time - 1;
    if (seconds >= 0) {
      this.setState({time:seconds})
    } else {
      this.endGame()
    }
  }
  
  startTimer = () => {
    if (!this.state.game_live) {
      this.setState({game_live:true});
      var intervalId = setInterval(this.timer, 1000)
      this.setState({timer_interval: intervalId})
    }
  }
  
  endGame = () => {
    clearInterval(this.state.timer_interval);
    // console.log('The game is over!');
    this.setState({game_live:false});
    // this.setState({team1_score:0});
    // this.setState({team2_score:0});
    this.setState({time:180});
    this.startTimer();
  }
  
  playConfetti = (timeout) => {
    this.setState({confetti_recycle: true}) 
    this.setState({confetti_run: true}) 
    setTimeout(() => {
      this.setState({confetti_recycle:false});
    },timeout * 1000)
  }

  setScore = (scoreUpdate) => {
    // console.log(this.state.team1_score);
    this.setState({team1_score: scoreUpdate.team1Score, team2_score: scoreUpdate.team2Score});
    if (scoreUpdate.team1Score !== 0 || scoreUpdate.team2Score !== 0) {
      if (this.state.playStatus == 'PLAYING'){
        this.setState({playStatus: 'STOPPED'})
      }
      this.setState({playUrl: singleDing, playStatus: 'PLAYING'});
      // play.sound('singleDing');
    }
  }

  handleSongFinishedPlaying = () => {
    // console.log('stopping song');
    this.setState({playStatus: 'STOPPED'})
  }

  setWinner = (scoreUpdate,timeout) => {
    if (this.state.playStatus == 'PLAYING'){
      this.setState({playStatus: 'STOPPED'})
    }
    this.setState({team1_score: scoreUpdate.team1Score, team2_score: scoreUpdate.team2Score, playUrl: singleDing, playStatus: 'PLAYING'});
    setTimeout(() => {
      this.setState({playUrl: winSound, playStatus: 'PLAYING'})
    }, 500);
    clearInterval(this.state.timer_interval);
    this.playConfetti(timeout)
    this.flashWinner(timeout,scoreUpdate)
    setTimeout(() => {
      this.endGame()
    }, timeout * 1000);

  }

  flashWinner = (timeout,scoreUpdate) => {
    //console.log('flashing winner');
    var intervalId1 = setInterval(() => {
      setTimeout(() => {
        if (scoreUpdate.winningTeam === 1) {
          this.setState({team1_score: 5});
        }
        else if (scoreUpdate.winningTeam === 2) {
          this.setState({team2_score: 5});
        }
      }, 500); 
    }, 1000);
    var intervalId2 = setInterval(() => {
      if (scoreUpdate.winningTeam === 1) {
        this.setState({team1_score: 'WIN'});
      }
      else if (scoreUpdate.winningTeam === 2) {
        this.setState({team2_score: 'WIN'});
      }
    }, 1000);
    setTimeout(() => {
      clearInterval(intervalId1);
      clearInterval(intervalId2);
    }, timeout * 1000);

  }

  render() {

    let {
      add_amount,
      time,
      team1_score,
      team2_score,
      home_label,
      away_label,
      home_logo,
      away_logo,
      cur_period,
      period_label,
      period_box,
      period_indicators,
      total_periods,
      team_possession,
      ballSpeed,
      playUrl,
      playStatus
    } = this.state;

    return (
      <div>
        <DimensionedExample recycle={this.state.confetti_recycle} run={this.state.confetti_run} />
        <ScoreboardSounds playStatus={playStatus} playUrl={playUrl} onFinishedPlaying={this.handleSongFinishedPlaying} />
        <div className="demo-app">
          <div className="demo-container">
            <ScoreboardTitle />
            <div id="inset-border">
              <ScoreboardDemo
                sport_name="Fogball ScoreBoard"
                add_amount={1}
                time={time}
                period_label="Speed of Last Shot"
                period_box={true}
                period_indicators={false}
                cur_period={1}
                total_periods={1}
                team1_score={team1_score}
                team2_score={team2_score}
                home_label={home_label}
                away_label={away_label}
                home_logo={HomeLogo}
                away_logo={AwayLogo}
              />

              <div className="react-scoreboard theme--dark" style={{
                  maxWidth: "1500px",
                  height: "425px",
                  marginTop: "-100px"
                  // background: "#313131",
                  // margin: "auto",
                  // padding: "20px",
                  // paddingTop: "25px",
                  // backgroundColor: "#313131",
                  // borderRadius: "4px",
                  // display: "block",
                  // outline: "2px solid #434343",
                  // outlineOffset: "-13px"
              }}>
              <div className="label-box theme--dark" style={{width: "30%", margin: "auto", marginBottom: "20px"}}><span className="label-text">Speed of Last Shot</span></div>
              <div style={{
                maxWidth: "450px",
                height:"275px",
                margin: "auto"
              }}>
                  <ReactSpeedometer
                      fluidWidth={true}
                      minValue={0}
                      maxValue={30}
                      value={ballSpeed}
                      segments={6}
                      needleColor="steelblue"
                      needleTransitionDuration={4000}
                      needleTransition="easeElastic"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}



const DimensionedExample = sizeMe({
  monitorHeight: true,
  monitorWidth: true,
})(class Example extends React.PureComponent {
  static propTypes = {
    size: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
    }),
  }
  render() {
    
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        <Confetti 
        recycle={this.props.recycle}
        run={this.props.run}
        {...this.props.size}/>
      </div>
    )
  }
})

class ScoreboardTitle extends Component {
  render() {
    return (
      <div id="header-wrapper">
        <div style={{margin:"auto", maxWidth: "1500px"}}>
          <h1 className="chrome">Score Board</h1>
          <h3 className="dreams">FogBall!</h3>
        </div>
      </div>
    )
  }
}

class ScoreboardSounds extends Component {

  render() {
    // return <Sound playStatus={this.props.playStatus} url={this.props.playUrl} />; // Check props in next section
    return (
      <Sound
        url={this.props.playUrl}
        playStatus={this.props.playStatus}
        autoLoad={true}
        onFinishedPlaying={this.props.onFinishedPlaying}
      />
    )
  }
}

// class reactScoreboard extends Component {
//   constructor(props) {
//     super(props);
//     this.state = Object.assign({}, this.props);
//   }

//   render() {
//     let {
//       data
//     } = this.props;

//     return (
//         <Leaderboard 
//           data={data} 
//           sortBy='highScore' 
//           labelBy='userName'/>
//     )
//   }
// }


class ScoreboardDemo extends Component {
  constructor(props) {
    super(props);
    this.state = Object.assign({}, this.props);
  }

  // componentDidMount() {
  //   this.startTimer();
  // }

  // pauseTime = () => {
  //   if (this.state.game_is_live) {
  //     this.setState({game_is_live: false});
  //     clearInterval(this.state.timer_interval);
  //   }
  // }

  // startTimer = () => {
  //   if (!this.state.game_is_live) {
  //     this.setState({
  //       game_is_live: true,
  //       timer_interval: setInterval(this.timer, 1000)
  //     })
  //   }
  // }

  // timer = () => {
  //   let seconds = this.state.time - 1;
  //   if (seconds >= 0) {
  //     this.setState({time: seconds})
  //   } else {
  //     this.EndPeriod()
  //   }
  // }

  // EndPeriod = () => {
  //   console.log('End of ' + this.state.period_label + ' ' + this.state.cur_period)
  //   this.setState({game_is_live: false});
  //   clearInterval(this.state.timer_interval);
  //   let cur_period = this.state.cur_period + 1;
  //   if (cur_period <= this.props.total_periods) {
  //     this.setState({
  //       time: this.props.period_length,
  //       cur_period: cur_period,
  //     });
  //     this.startTimer();
  //   } else {
  //     this.gameOver();
  //   }
  // }

  // gameOver = () => {
  //   console.log('The ' + this.state.sport_name + ' game is over!');
  // }

  // addHomeScore = () => {
  //   this.setState({'home_score': boardData.team1_score})
  // }

  // addAwayScore = () => {
  //   this.setState({'away_score': this.state.away_score + this.state.add_amount})
  // }

  render() {
    let {
      add_amount,
      time,
      team1_score,
      team2_score,
      home_label,
      away_label,
      home_logo,
      away_logo,
      cur_period,
      period_label,
      period_box,
      period_indicators,
      total_periods,
      team_possession
    } = this.props;

    return (
      // <div className="demo-app">
      //   <h2 className="demo-title">{this.state.sport_name}</h2>
      //   <div className="scoreboard-control-panel">
      //     <button className="btn-demo" onClick={this.addHomeScore}>
      //      +{add_amount} Points Home
      //     </button>
      //     <button className="btn-demo" onClick={this.addAwayScore}>
      //      +{add_amount} Points Away
      //     </button>
      //   </div>
      //   <div className="demo-container">
          <Scoreboard
            // theme="whale"
            // theme="dragon"
            // theme="unicorn"
            // theme="unicorn-dark"
            // theme="ice"
            time={time}
            home_score={team1_score}
            away_score={team2_score}
            home_label={home_label}
            away_label={away_label}
            home_logo={home_logo}
            away_logo={away_logo}
            cur_period={cur_period}
            period_label={period_label}
            period_box={period_box}
            period_indicators={period_indicators}
            total_periods={total_periods}
            >
          </Scoreboard>
      //   </div>
      // </div>
    );
  }
}

// export default Demo;
export default App;