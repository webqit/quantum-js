
/**
 * @imports
 */
import ExprInterface from './ExprInterface.js';
import IndependentExprInterface from './IndependentExprInterface.js';
import Abstraction from './grammar/Abstraction.js';
import AbstractionInterface from './grammar/AbstractionInterface.js';
import Arr from './grammar/Arr.js';
import ArrInterface from './grammar/ArrInterface.js';
import Arguments from './grammar/Arguments.js';
import ArgumentsInterface from './grammar/ArgumentsInterface.js';
import Assertion from './grammar/Assertion.js';
import AssertionInterface from './grammar/AssertionInterface.js';
import Assignment from './grammar/Assignment.js';
import AssignmentInterface from './grammar/AssignmentInterface.js';
import Block from './grammar/Block.js';
import BlockInterface from './grammar/BlockInterface.js';
import Bool from './grammar/Bool.js';
import BoolInterface from './grammar/BoolInterface.js';
import Call from './grammar/Call.js';
import CallInterface from './grammar/CallInterface.js';
import Comparison from './grammar/Comparison.js';
import ComparisonInterface from './grammar/ComparisonInterface.js';
import Condition from './grammar/Condition.js';
import ConditionInterface from './grammar/ConditionInterface.js';
import Deletion from './grammar/Deletion.js';
import DeletionInterface from './grammar/DeletionInterface.js';
import Func from './grammar/Func.js';
import FuncInterface from './grammar/FuncInterface.js';
import If from './grammar/If.js';
import IfInterface from './grammar/IfInterface.js';
import Math from './grammar/Math.js';
import MathInterface from './grammar/MathInterface.js';
import Num from './grammar/Num.js';
import NumInterface from './grammar/NumInterface.js';
import Obj from './grammar/Obj.js';
import ObjInterface from './grammar/ObjInterface.js';
import Presence from './grammar/Presence.js';
import PresenceInterface from './grammar/PresenceInterface.js';
import Reference from './grammar/Reference.js';
import ReferenceInterface from './grammar/ReferenceInterface.js';
import Return from './grammar/Return.js';
import ReturnInterface from './grammar/ReturnInterface.js';
import Str from './grammar/Str.js';
import StrInterface from './grammar/StrInterface.js';
import Void from './grammar/Void.js';
import VoidInterface from './grammar/VoidInterface.js';

/**
 * @var object
 */
export default {
	If: If,						// if (condition) expr1 else expre2
	//Block: Block,				// field1 = 3; field2 = val2
	Return: Return,				// return field1
	Deletion: Deletion,			// delete field1
	Assignment: Assignment,		// field1[key1].key2 = k
	Presence: Presence,			// key1 in field1
	Func: Func,					// (field1, field2) => {}
	Abstraction: Abstraction,	// (field1)
	Condition: Condition,		// field1 > field2 ? val1 : val2
	Assertion: Assertion,		// !field1 && field2
	Comparison: Comparison,		// field1 > field2
	Math: Math,					// field1 + field2
	Arr: Arr,					// [field1, field2]
	Obj: Obj,					// {field1:val1, field2:val2}
	Num: Num,					// [0-9]
	Str: Str,					// ""
	Bool: Bool,					// true
	Void: Void,					// null|undefined
	Call: Call,					// field1()
	Reference: Reference,		// field1
};

/**
 * @exports
 */
export {
	ExprInterface,
	IndependentExprInterface,
};
export {
	Abstraction,
	Arr,
	Arguments,
	Assertion,
	Assignment,
	Block,
	Bool,
	Call,
	Comparison,
	Condition,
	Deletion,
	Func,
	If,
	Math,
	Num,
	Obj,
	Presence,
	Reference,
	Return,
	Str,
	Void,
};
export {
	AbstractionInterface,
	ArrInterface,
	ArgumentsInterface,
	AssertionInterface,
	AssignmentInterface,
	BlockInterface,
	BoolInterface,
	CallInterface,
	ComparisonInterface,
	ConditionInterface,
	DeletionInterface,
	FuncInterface,
	IfInterface,
	MathInterface,
	NumInterface,
	ObjInterface,
	PresenceInterface,
	ReferenceInterface,
	ReturnInterface,
	StrInterface,
	VoidInterface,
};