import React from 'react';
import logo from './logo.svg';
import './App.css';

const PIECE_TYPES = {
  PAWN: 'Pawn',
  ROOK: 'Rook',
  BISHOP: 'Bishop',
  KNIGHT: 'Knight',
  KING: 'King',
  QUEEN: 'Queen'
};

const PIECE_COLORS = {
  LIGHT: 'Light',
  DARK: 'Dark'
};

function Square(props) {
  let squareType = props.row % 2 === 0 ? (props.column % 2 === 0 ? 'light' : 'dark') : (props.column % 2 === 0 ? "dark" : "light");
  let icon;
  if ( props.piece !== null ) {
    icon = props.piece.draw();
  } 
  return (
    <button className={"square " + squareType} onClick={props.onClick}>{icon}</button>
  );
}

class Board extends React.Component {
  renderSquare(i,j) {
    return (
      <Square row={i} column={j} piece={this.props.pieces[i][j]} onClick={() => this.props.onClick(i,j)} />
    );
  }

  renderRow(i) {
    return (
      <div className="board-row">
        {this.renderSquare(i,0)}
        {this.renderSquare(i,1)}
        {this.renderSquare(i,2)}
        {this.renderSquare(i,3)}
        {this.renderSquare(i,4)}
        {this.renderSquare(i,5)}
        {this.renderSquare(i,6)}
        {this.renderSquare(i,7)}
      </div>
     );
  }

  render() {
    return (
      <div>
       {this.renderRow(0)}
       {this.renderRow(1)}
       {this.renderRow(2)}
       {this.renderRow(3)}
       {this.renderRow(4)}
       {this.renderRow(5)}
       {this.renderRow(6)}
       {this.renderRow(7)}
      </div> 
    );
  }
}

// This is a fairly shallow class, if we make any nested objects, we'll need to update checkForCheck to do a deep copy
class Piece {
  constructor(props) {
    this.id = props.id;
    this.color = props.color;
    this.row = props.row;
    this.column = props.column;
    this.type = props.type;
    this.hasMoved = false;
  }

  draw() {
    switch(this.type) {
      case PIECE_TYPES.PAWN:
        return this.color === PIECE_COLORS.LIGHT ? '\u2659' : '\u265F';
      case PIECE_TYPES.KNIGHT:
        return this.color === PIECE_COLORS.LIGHT ? '\u2658' : '\u265E';
      case PIECE_TYPES.BISHOP:
        return this.color === PIECE_COLORS.LIGHT ? '\u2657' : '\u265D';
      case PIECE_TYPES.ROOK:
        return this.color === PIECE_COLORS.LIGHT ? '\u2656' : '\u265C';
      case PIECE_TYPES.QUEEN:
        return this.color === PIECE_COLORS.LIGHT ? '\u2655' : '\u265B';
      case PIECE_TYPES.KING:
        return this.color === PIECE_COLORS.LIGHT ? '\u2654' : '\u265A';
      default:
        console.log('Draw - invalid piece type: ' + this.type );
        break;
    }
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);

    let arr = Array(8).fill(null).map(() => new Array(8).fill(null));
    let pieceMap = new Map();

    pieceMap.set(PIECE_COLORS.DARK, new Map());
    pieceMap.set(PIECE_COLORS.LIGHT, new Map());

    for ( let i = 0; i < 32; i++ ) {
      let pieceIdx = i % 8;
      let relativeRow = Math.floor(i / 8)
      let pieceColor = relativeRow <= 1 ? PIECE_COLORS.DARK : PIECE_COLORS.LIGHT;
      let pieceType;
      
      if ( relativeRow === 0 || relativeRow === 3 ) { 
        switch (pieceIdx) {
          case 0:
          case 7:
            pieceType = PIECE_TYPES.ROOK; 
            break;
          case 1:
          case 6:
            pieceType = PIECE_TYPES.KNIGHT;
            break;
          case 2:
          case 5:
            pieceType = PIECE_TYPES.BISHOP;
            break;
          case 3:
            pieceType = pieceColor === PIECE_COLORS.DARK ? PIECE_TYPES.QUEEN : PIECE_TYPES.KING;
            break;
          case 4:
            pieceType = pieceColor === PIECE_COLORS.DARK ? PIECE_TYPES.KING : PIECE_TYPES.QUEEN;
            break;
          default:
            console.log( 'Encountered an issue with piece generation. Unknown index: ' + pieceIdx );
        }
      } else {
        pieceType = PIECE_TYPES.PAWN;
      }

      let row = relativeRow;
      if ( row > 1 ) {
        row += 4;
      }
      console.log( 'Adding ' + pieceColor + ' ' + pieceType + ' to ' + row + ',' + pieceIdx );
      let p = new Piece({ id: i, color: pieceColor, row: row, column: pieceIdx, type: pieceType });
      pieceMap.get( pieceColor ).set( i, p ); 

      arr[row][pieceIdx] = p;
    }

    let isKingInCheck = new Map([[PIECE_COLORS.LIGHT,false],[PIECE_COLORS.DARK, false]] );
    this.state = {
      pieces: arr,
      lightIsNext: true,
      selectedPiece: null,
      selectedIndex: null,
      isWhiteTurn: true,
      pieceMap: pieceMap,
      isKingInCheck: isKingInCheck
    };
  }

  testStraight(piece, moveUp, moveLeft, rowDiff, colDiff, toRow, toColumn, piecesArray) {
    if ( rowDiff > 0 ) {
      let increment = moveUp ? -1 : 1;
      for ( let i = piece.row + increment; i !== toRow; i += increment ) {
        if ( piecesArray[i][piece.column] !== null ) {
          return false;
        }
      }
    } else {
      let increment = moveLeft ? -1 : 1;
      for ( let i = piece.column + increment; i !== toColumn; i += increment ) {
        if ( piecesArray[piece.row][i] !== null ) {
          return false;
        }
      }  
    } 
    return true;
  }

  // Checks to see if the current setup places this team's king in danger
  checkForCheck(boardArray, movedPiece, toRow, toColumn) {
    let pieceMap, kingRow, kingCol;
    if ( this.state.isWhiteTurn ) {
      pieceMap = this.state.pieceMap.get(PIECE_COLORS.DARK);
      if ( movedPiece.type === PIECE_TYPES.KING ) {
        kingRow = toRow;
        kingCol = toColumn;
      } else {
        kingRow = this.state.pieceMap.get(PIECE_COLORS.LIGHT).get(27).row;
        kingCol = this.state.pieceMap.get(PIECE_COLORS.LIGHT).get(27).column;
      }
    } else {
      pieceMap = this.state.pieceMap.get(PIECE_COLORS.LIGHT);
      if ( movedPiece.type === PIECE_TYPES.KING ) {
        kingRow = toRow;
        kingCol = toColumn;
      } else {
        kingRow = this.state.pieceMap.get(PIECE_COLORS.DARK).get(4).row;
        kingCol = this.state.pieceMap.get(PIECE_COLORS.DARK).get(4).column;
      }
    }
    
    for (let val of pieceMap.values()) {
      if ( this.canMove( val, kingRow, kingCol, boardArray) ) {
        console.log( val.color + ' ' + val.type + ' can kill the king at ' + kingRow + ',' + kingCol + '!' );
        return true;
      } else {
        console.log( val.color + ' ' + val.type + ' can\'t kill the king at ' + kingRow + ',' + kingCol );
      }      
    }
    return false;
  }

  // If we're here, we already know the target space isn't occupied by a piece of the same color
  // So we need to check if:
  // 1) Is this a valid move based on the piece's rules?
  // 2) Will this move put this team into check, thus making it an invalid move?

  canMove(piece, toRow, toColumn, boardArray) {
    console.log( 'Checking movement of ' + piece.color + ' ' + piece.type + ' from ' + piece.row + ',' + piece.column + ' to ' + toRow + ',' + toColumn );

    let piecesArray = (boardArray === undefined ? this.state.pieces : boardArray);
    let targetOccupied = piecesArray[toRow][toColumn];

    let rowDiff = piece.row - toRow;
    let colDiff = piece.column - toColumn;
    let moveUp = rowDiff > 0;
    let moveLeft = colDiff > 0;

    rowDiff = Math.abs(rowDiff);
    colDiff = Math.abs(colDiff);

    switch(piece.type) {
      case PIECE_TYPES.PAWN:
        if (piece.hasMoved) {
          if ( targetOccupied ) {
            // Diagonally forward
            if ( piece.color === PIECE_COLORS.LIGHT ) {
              return moveUp && rowDiff === 1 && colDiff === 1;
            } else {
              return !moveUp && rowDiff === 1 && colDiff === 1;;  
            }
          } else {
            // No need to check for other pieces in the path
            if ( piece.color === PIECE_COLORS.LIGHT ) {
              return moveUp && rowDiff === 1 && colDiff === 0;
            } else {
              return !moveUp && rowDiff === 1 && colDiff === 0;
            }
          }           
        } else {
          if ( targetOccupied ) {
            if ( piece.color === PIECE_COLORS.LIGHT ) {
              return moveUp && rowDiff === 1 && colDiff === 1;
            } else {
              return !moveUp && rowDiff === 1 && colDiff === 1;;  
            }
          } else {
            if ( piece.color === PIECE_COLORS.LIGHT ) {
              if ( moveUp && rowDiff <= 2 && colDiff === 0 ) {
                // Check for anything in the path  
                return !( rowDiff === 2 && piecesArray[piece.row-1][piece.column] !== null );
              } 
            } else {
              if ( !moveUp && rowDiff <= 2 && colDiff === 0 ) {
                return !( rowDiff === 2 && piecesArray[piece.row+1][piece.column] !== null );
              } 
            }
          }
        }
        break;
      case PIECE_TYPES.ROOK:
        if ( rowDiff > 0 && colDiff > 0 ) {
          return false;
        } 
        // Anything in the way? 
        return this.testStraight(piece, moveUp, moveLeft, rowDiff, colDiff, toRow, toColumn, piecesArray);
      case PIECE_TYPES.KNIGHT:
        return ( rowDiff === 2 && colDiff === 1 ) || (rowDiff === 1 && colDiff === 2);
      case PIECE_TYPES.BISHOP:
        if ( rowDiff === colDiff ) {
          return this.testDiagonal(piece, moveUp, moveLeft, toRow, toColumn, piecesArray);
        }
        return false;
      case PIECE_TYPES.QUEEN:
        if ( rowDiff === colDiff ) {
          return this.testDiagonal(piece, moveUp, moveLeft, toRow, toColumn, piecesArray); 
        } else if ( (rowDiff > 0 && colDiff === 0) || (rowDiff === 0 && colDiff > 0) ) {
          return this.testStraight(piece, moveUp, moveLeft, rowDiff, colDiff, toRow, toColumn, piecesArray);
        }
        break;
      case PIECE_TYPES.KING:
        return ( rowDiff <= 1 && colDiff <= 1 );
      default:
        console.log('Move called with invalid piece type: ' + piece.type );
        return false;
    }  
  }
 
  testDiagonal(piece, moveUp, moveLeft, toRow, toColumn, piecesArray) {
    let incrRow = moveUp ? -1 : 1;
    let incrCol = moveLeft ? -1 : 1;
    for ( let i = incrRow, j = incrCol; piece.row+i !== toRow && piece.column+j !== toColumn; i += incrRow, j+= incrCol ) {
      console.log( 'Testing diagonal - is anything at ' + (piece.row+i) + ',' + (piece.column+j) + ' on the way to ' + toRow + ',' + toColumn + '?' );
      if ( piecesArray[piece.row+i][piece.column+j] !== null ) {
        return false;
      }
    }
    return true;
  }

  copyPieceMap(originalMap) {
    let newMap = new Map();
    originalMap.forEach( (val,key) => {
      newMap.set(key,val);
    });
    return originalMap;
  }

  handleClick(i,j) {
    if ( this.state.selectedPiece === null ) {
      let selectedText = null;
      if ( this.state.pieces[i][j] !== null && this.state.pieces[i][j].color === (this.state.isWhiteTurn ? PIECE_COLORS.LIGHT : PIECE_COLORS.DARK)) {
        selectedText = "Selected " + this.state.pieces[i][j].color + " " + this.state.pieces[i][j].type
        this.setState({ 
          selectedPiece: this.state.pieces[i][j],
          selectedRow: i,
          selectedColumn: j,
          selectedPieceText: selectedText
        });
      }
    } else if ( this.state.pieces[i][j] === null || this.state.pieces[i][j].color !== this.state.selectedPiece.color ) {
      // We made sure the square we're moving to is empty or is an enemy piece


      if ( this.canMove(this.state.selectedPiece,i,j) ) {
        // Update the pieceMap if any pieces have been destroyed
        if ( this.state.pieces[i][j] !== null ) {
          // We save the copy for this branch, since we'd rather not have to do this every time
          let copiedPieceMap = this.copyPieceMap(this.state.pieceMap);
          copiedPieceMap.get(this.state.pieces[i][j].color).delete(this.state.pieces[i][j].id);
          console.log( 'Deleting piece ' + this.state.pieces[i][j].color + ' ' + this.state.pieces[i][j].type + ' ' + this.state.pieces[i][j].id );
          this.setState({ pieceMap: copiedPieceMap });
        }
        
        // Make a semi-deep copy of the pieces
        const arr = this.state.pieces.slice();
        for ( let i in arr ) {
          arr[i] = this.state.pieces[i].slice();
        }
  
        // Set the new location for this piece
        arr[i][j] = this.state.selectedPiece;

        // Ensure this move doesn't put us in check!
        let isKingInCheck = new Map(this.state.isKingInCheck);
        if ( this.checkForCheck(arr, this.state.selectedPiece, i, j) ) {
          // This move places our king in check
          isKingInCheck.set( this.state.selectedPiece.color, true );
          this.setState({ isKingInCheck: isKingInCheck });
          return;
        } else {
          isKingInCheck.set( this.state.selectedPiece.color, false );
        }
  
        // Update the piece itself
        let thisPiece = this.state.selectedPiece;
        thisPiece.hasMoved = true;
        thisPiece.row = i;
        thisPiece.column = j;

        // Remove the piece from the old location
        arr[this.state.selectedRow][this.state.selectedColumn] = null;

        this.setState({
          selectedPiece: null,
          selectedRow: null,
          selectedColumn: null,
          pieces: arr,
          selectedPieceText: null,
          isWhiteTurn: !this.state.isWhiteTurn,
          isKingInCheck: isKingInCheck
        });
      }
    } else if ( this.state.pieces[i][j] === this.state.selectedPiece ) {
      // Clicked the same piece, so deselect
      this.setState({
        selectedPiece: null,
        selectedRow: null,
        selectedColumn: null,
        selectedPieceText: null
      });
    }
  }

  render() {
    let isWhiteKingInCheck = this.state.isKingInCheck.get(PIECE_COLORS.LIGHT) ? 'Cannot place white king in check!' : '';
    let isBlackKingInCheck = this.state.isKingInCheck.get(PIECE_COLORS.DARK) ? 'Cannot place black king in check!' : '';

    return (
      <div className="game">
        <div className="game-board">
          <Board pieces={this.state.pieces} onClick={(i,j) => this.handleClick(i,j)}/> 
        </div>
        <div className="turnText">{"Turn: " + (this.state.isWhiteTurn ? 'White' : 'Black')}</div>
        <div className="selectedPiece">{this.state.selectedPieceText}</div>
        <div className="inCheck">{isWhiteKingInCheck}</div>
        <div className="inCheck">{isBlackKingInCheck}</div>
      </div>
    );
  }
}

export default App;
